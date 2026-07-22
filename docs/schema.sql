-- =============================================================================
-- Vedette — Database Schema & RLS Strategy (Phase 0)
-- =============================================================================
-- Target: Supabase Postgres (>= 15) with pgvector. Data access is the Supabase
-- client (ADR-001, no ORM). Auth is Clerk as a Supabase third-party auth
-- provider (ADR-002); the Clerk session JWT carries an `org_id` claim.
--
-- This file is the source of truth for the data model. Phase 1 splits it into
-- ordered files under supabase/migrations/. It is written to be run top-to-bottom.
--
-- Invariants encoded here (see docs/architecture.md §1):
--   * Multi-tenant: every domain row carries organization_id; RLS is default-deny.
--   * Evidence-or-nothing: claims link to a source chunk/answer via evidence_links.
--   * Assumptions are labeled: scores/ROI inputs carry is_assumption + confidence.
--   * Money is never stored as a raw LLM output: ROI dollar fields are computed
--     by application TypeScript from the input columns and cached here.
--
-- Required tables (Phase 0 acceptance): organizations, users, engagements,
--   documents, chunks, interviews, answers, processes, systems, stakeholders,
--   opportunities, scores, evidence_links, deliverables, recommendation_feedback.
-- Supporting tables (justified, clearly labeled): roi_models, agent_runs.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "vector";      -- pgvector

-- ----------------------------------------------------------------------------
-- 1. Enumerated types
-- ----------------------------------------------------------------------------
create type org_size_band       as enum ('smb', 'mid_market', 'enterprise');
create type org_role            as enum ('owner', 'admin', 'member', 'viewer');
create type engagement_status   as enum ('discovery', 'analysis', 'synthesis', 'delivered', 'archived');

create type doc_type            as enum (
  'sop', 'process_doc', 'transcript', 'policy', 'org_chart',
  'report', 'presentation', 'spreadsheet', 'ticket_export', 'other');
create type doc_status          as enum ('uploaded', 'parsing', 'parsed', 'chunked', 'embedded', 'failed');

create type discovery_area      as enum (
  'company_profile', 'objectives', 'dept_structure', 'tech_environment',
  'ai_adoption', 'processes', 'manual_workflows', 'approvals',
  'data_availability', 'security', 'compliance', 'pain_points',
  'cx_challenges', 'revenue_opportunities', 'cost_reduction');
create type interview_status    as enum ('scheduled', 'in_progress', 'completed');
create type author_kind         as enum ('agent', 'human');   -- who produced a row

create type process_source      as enum ('extracted', 'interview', 'manual');
create type system_category     as enum ('crm', 'erp', 'email', 'storage', 'communication', 'custom', 'spreadsheet', 'other');
create type stakeholder_role    as enum ('sponsor', 'decision_maker', 'sme', 'end_user', 'it', 'other');

create type opportunity_status  as enum ('candidate', 'scored', 'accepted', 'rejected', 'in_roadmap');
create type score_dimension     as enum (
  'business_impact', 'roi_potential', 'implementation_effort', 'technical_complexity',
  'risk', 'data_availability', 'adoption_likelihood', 'strategic_alignment',
  'time_to_value', 'executive_priority');

-- Polymorphic evidence: which kind of record a piece of evidence supports,
-- and which kind of source it comes from.
create type evidence_subject    as enum ('opportunity', 'score', 'process', 'system', 'stakeholder', 'deliverable_section', 'roi_model');
create type evidence_source     as enum ('chunk', 'answer');

create type deliverable_type    as enum (
  'exec_brief', 'current_state', 'ai_readiness', 'top_opportunities',
  'roi_analysis', 'risk_assessment', 'ninety_day_plan', 'twelve_month_roadmap',
  'board_summary', 'change_management');
create type deliverable_status  as enum ('draft', 'in_review', 'critic_passed', 'final');

create type feedback_decision   as enum ('accepted', 'rejected', 'deferred', 'edited');
create type agent_kind          as enum ('discovery', 'analysis_scoring', 'executive_synthesis', 'critic');

-- ----------------------------------------------------------------------------
-- 2. Tenancy helpers (RLS reads these; they read the Clerk JWT)
-- ----------------------------------------------------------------------------
-- The Clerk session token is configured to include claim `org_id` = {{org.id}}
-- and the Clerk user id in `sub`. Supabase validates the token via JWKS and
-- exposes claims through auth.jwt().
--
-- auth.org_id() resolves the caller's ACTIVE Clerk org to our internal
-- organizations.id. Marked STABLE so Postgres evaluates it once per statement.
-- SECURITY DEFINER so the lookup itself isn't blocked by RLS on organizations.

create schema if not exists app;

create or replace function auth.clerk_org()
returns text
language sql stable
as $$
  select nullif(auth.jwt() ->> 'org_id', '')
$$;

create or replace function auth.clerk_user()
returns text
language sql stable
as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;

create or replace function auth.org_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select o.id
  from public.organizations o
  where o.clerk_org_id = auth.clerk_org()
$$;

-- Role of the current user within the current org (null if not a member).
create or replace function auth.org_role()
returns org_role
language sql stable security definer
set search_path = public
as $$
  select u.role
  from public.users u
  where u.organization_id = auth.org_id()
    and u.clerk_user_id  = auth.clerk_user()
$$;

-- Convenience predicate: caller may write engagement/domain data.
create or replace function auth.can_write()
returns boolean
language sql stable
as $$
  select auth.org_role() in ('owner', 'admin', 'member')
$$;

-- ----------------------------------------------------------------------------
-- 3. updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function app.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =============================================================================
-- 4. TABLES
-- =============================================================================
-- Convention: every domain table carries organization_id (RLS boundary) and,
-- where it belongs to a project, engagement_id (work scope). created_at/updated_at
-- everywhere; author_kind where a row can be produced by an agent or a human.

-- 4.1 organizations — the tenant root (a consultancy OR a self-serve enterprise)
create table public.organizations (
  id            uuid primary key default gen_random_uuid(),
  clerk_org_id  text not null unique,
  name          text not null,
  slug          text unique,
  industry      text,
  size_band     org_size_band,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 4.2 users — org-scoped profile mirror of Clerk users (synced via webhook).
--     A Clerk user in N orgs has N rows here (one per membership) — hence the
--     composite uniqueness rather than a global unique on clerk_user_id.
create table public.users (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clerk_user_id   text not null,
  email           text,
  full_name       text,
  role            org_role not null default 'member',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, clerk_user_id)
);

-- 4.3 engagements — one assessment project (e.g. seeded "Meridian Field Services")
create table public.engagements (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  client_name     text,                       -- company being assessed
  client_industry text,
  client_size_band org_size_band,
  status          engagement_status not null default 'discovery',
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 4.4 documents — uploaded source material (file itself lives in Storage)
create table public.documents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  engagement_id   uuid not null references public.engagements(id) on delete cascade,
  uploaded_by     uuid references public.users(id) on delete set null,
  storage_path    text not null,              -- {organization_id}/{engagement_id}/{id}/filename
  file_name       text not null,
  mime_type       text,
  byte_size       bigint,
  doc_type        doc_type not null default 'other',
  title           text,
  status          doc_status not null default 'uploaded',
  parse_error     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 4.5 chunks — parsed + embedded document segments (pgvector). SOURCE of evidence.
--     NOTE: vector dimension is provisional (1536 = OpenAI text-embedding-3-small).
--     Final embedding model is an OPEN QUESTION for Phase 1/2 — see architecture §9.
create table public.chunks (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  engagement_id   uuid not null references public.engagements(id) on delete cascade,
  document_id     uuid not null references public.documents(id) on delete cascade,
  chunk_index     int  not null,
  content         text not null,
  token_count     int,
  embedding       vector(1536),
  metadata        jsonb not null default '{}'::jsonb,  -- {page, section, headings…}
  created_at      timestamptz not null default now(),
  unique (document_id, chunk_index)
);

-- 4.6 stakeholders — people in the client org (defined before interviews, which FK to it)
create table public.stakeholders (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  engagement_id   uuid not null references public.engagements(id) on delete cascade,
  name            text not null,
  title           text,
  department      text,
  email           text,
  role_type       stakeholder_role not null default 'other',
  influence       int check (influence between 1 and 5),
  notes           text,
  source          author_kind not null default 'human',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 4.7 interviews — discovery sessions, typically one per stakeholder
create table public.interviews (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  engagement_id   uuid not null references public.engagements(id) on delete cascade,
  stakeholder_id  uuid references public.stakeholders(id) on delete set null,
  conducted_by    uuid references public.users(id) on delete set null,
  title           text,
  status          interview_status not null default 'in_progress',
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 4.8 answers — interview Q/A. Each answer is an EVIDENCE source (see evidence_links).
create table public.answers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  engagement_id   uuid not null references public.engagements(id) on delete cascade,
  interview_id    uuid not null references public.interviews(id) on delete cascade,
  discovery_area  discovery_area,
  question        text not null,
  answer          text,
  asked_by        author_kind not null default 'agent',   -- agent-generated vs human-entered Q
  confidence      numeric(4,3) check (confidence between 0 and 1),
  answered_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- 4.9 systems — software/tools in the client environment (system map nodes)
create table public.systems (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  engagement_id   uuid not null references public.engagements(id) on delete cascade,
  name            text not null,
  vendor          text,
  category        system_category not null default 'other',
  description     text,
  source          author_kind not null default 'extracted',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 4.10 processes — business processes (process map nodes)
create table public.processes (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  engagement_id        uuid not null references public.engagements(id) on delete cascade,
  name                 text not null,
  description          text,
  department           text,
  owner_stakeholder_id uuid references public.stakeholders(id) on delete set null,
  frequency            text,                 -- free text (e.g. "daily", "per invoice")
  pain_level           int check (pain_level between 1 and 5),
  source               process_source not null default 'extracted',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- 4.11 opportunities — candidate AI opportunities
create table public.opportunities (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  engagement_id      uuid not null references public.engagements(id) on delete cascade,
  title              text not null,
  description        text,
  category           text,
  related_process_id uuid references public.processes(id) on delete set null,
  status             opportunity_status not null default 'candidate',
  created_by         author_kind not null default 'agent',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- 4.12 scores — one row per (opportunity, dimension). Evidence OR assumption.
--      A score with no linked evidence MUST set is_assumption = true (enforced in
--      the write path, lib/evidence; the UI renders assumptions distinctly).
create table public.scores (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  engagement_id   uuid not null references public.engagements(id) on delete cascade,
  opportunity_id  uuid not null references public.opportunities(id) on delete cascade,
  dimension       score_dimension not null,
  value           numeric(5,2) not null check (value between 0 and 100),
  rationale       text,
  is_assumption   boolean not null default false,
  confidence      numeric(4,3) check (confidence between 0 and 1),
  computed_by     author_kind not null default 'agent',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (opportunity_id, dimension)
);

-- 4.13 roi_models — SUPPORTING (Phase 4). LLM proposes the *input* columns only;
--      TypeScript (lib/roi) computes the *_usd / payback columns deterministically.
--      Splitting inputs from computed outputs makes the "LLM never emits $" rule
--      structurally visible: inputs are model-writable, outputs are app-written.
create table public.roi_models (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references public.organizations(id) on delete cascade,
  engagement_id            uuid not null references public.engagements(id) on delete cascade,
  opportunity_id           uuid not null references public.opportunities(id) on delete cascade,
  -- ── inputs (model-proposed, human-editable; NO currency here) ──
  hours_per_occurrence     numeric(10,2),
  occurrences_per_week     numeric(10,2),
  people_affected          int,
  loaded_hourly_cost_usd   numeric(10,2),   -- an INPUT assumption, editable, labeled
  adoption_pct             numeric(5,2) check (adoption_pct between 0 and 100),
  ramp_months              int,
  inputs_are_assumptions   boolean not null default true,
  -- ── computed outputs (written by lib/roi, never by the model) ──
  annual_hours_saved       numeric(12,2),
  annual_savings_usd       numeric(14,2),
  payback_months           numeric(8,2),
  computed_at              timestamptz,
  created_by               author_kind not null default 'agent',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- 4.14 evidence_links — the spine of the whole product. Polymorphic: connects any
--      claim-bearing record (subject) to its source (a chunk or an answer).
--      Polymorphic FKs can't be declared to two targets at once, so integrity is
--      enforced by (a) the enum'd source_type, (b) a validity trigger below, and
--      (c) the application write path. Tradeoff accepted for a single uniform
--      evidence table over many join tables — see architecture §1.
create table public.evidence_links (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  engagement_id   uuid not null references public.engagements(id) on delete cascade,
  subject_type    evidence_subject not null,
  subject_id      uuid not null,
  source_type     evidence_source  not null,
  source_id       uuid not null,          -- chunks.id when 'chunk', answers.id when 'answer'
  excerpt         text,                   -- the specific supporting snippet
  relevance       numeric(4,3) check (relevance between 0 and 1),
  created_by      author_kind not null default 'agent',
  created_at      timestamptz not null default now()
);

-- Enforce that source_id points at a real row of the declared source_type and
-- that the source belongs to the same tenant/engagement.
create or replace function app.validate_evidence_source()
returns trigger language plpgsql as $$
declare ok boolean;
begin
  if new.source_type = 'chunk' then
    select exists(
      select 1 from public.chunks c
      where c.id = new.source_id
        and c.organization_id = new.organization_id
        and c.engagement_id  = new.engagement_id
    ) into ok;
  else -- 'answer'
    select exists(
      select 1 from public.answers a
      where a.id = new.source_id
        and a.organization_id = new.organization_id
        and a.engagement_id  = new.engagement_id
    ) into ok;
  end if;
  if not ok then
    raise exception 'evidence source % % not found in tenant/engagement', new.source_type, new.source_id;
  end if;
  return new;
end;
$$;

create trigger trg_evidence_source
  before insert or update on public.evidence_links
  for each row execute function app.validate_evidence_source();

-- 4.15 deliverables — executive outputs. Sections + claims live in structured JSON,
--      each claim referencing evidence_links ids. Critic verdict recorded inline.
create table public.deliverables (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  engagement_id   uuid not null references public.engagements(id) on delete cascade,
  type            deliverable_type not null,
  title           text not null,
  status          deliverable_status not null default 'draft',
  content         jsonb not null default '{}'::jsonb,   -- {sections:[{heading, body, claims:[{text, evidence_link_ids:[]}]}]}
  critic_notes    jsonb,                                -- {verdict, issues:[…]}
  version         int not null default 1,
  generated_by    author_kind not null default 'agent',
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 4.16 recommendation_feedback — accept/reject/edit tracking (learning signal).
create table public.recommendation_feedback (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  engagement_id   uuid not null references public.engagements(id) on delete cascade,
  opportunity_id  uuid references public.opportunities(id) on delete cascade,
  deliverable_id  uuid references public.deliverables(id) on delete cascade,
  decision        feedback_decision not null,
  reason          text,
  corrected_value jsonb,                 -- if a human overrode a score/assumption
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  check (opportunity_id is not null or deliverable_id is not null)
);

-- 4.17 agent_runs — SUPPORTING. Observability + traceability for every agent call.
create table public.agent_runs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  engagement_id   uuid not null references public.engagements(id) on delete cascade,
  agent           agent_kind not null,
  model           text,
  input_summary   jsonb,
  output_summary  jsonb,
  critic_verdict  text,                  -- 'pass' | 'revise' (for synthesis/scoring runs)
  prompt_tokens   int,
  completion_tokens int,
  latency_ms      int,
  error           text,
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. Indexes
-- ----------------------------------------------------------------------------
-- Tenant/engagement access paths (RLS predicates hit organization_id constantly).
create index on public.users                 (organization_id);
create index on public.engagements           (organization_id);
create index on public.documents             (organization_id, engagement_id);
create index on public.chunks                (organization_id, engagement_id);
create index on public.chunks                (document_id);
create index on public.interviews            (organization_id, engagement_id);
create index on public.answers               (organization_id, engagement_id, interview_id);
create index on public.stakeholders          (organization_id, engagement_id);
create index on public.systems               (organization_id, engagement_id);
create index on public.processes             (organization_id, engagement_id);
create index on public.opportunities         (organization_id, engagement_id);
create index on public.scores                (organization_id, engagement_id, opportunity_id);
create index on public.roi_models            (organization_id, engagement_id, opportunity_id);
create index on public.deliverables          (organization_id, engagement_id);
create index on public.recommendation_feedback (organization_id, engagement_id);
create index on public.agent_runs            (organization_id, engagement_id);

-- Evidence lookups go both directions: "evidence for this subject" and
-- "everything sourced from this chunk/answer".
create index on public.evidence_links (organization_id, engagement_id, subject_type, subject_id);
create index on public.evidence_links (source_type, source_id);

-- Vector similarity. HNSW for good recall/latency without a training step.
-- (cosine ops; swap to vector_l2_ops if the embedding model prefers L2.)
create index on public.chunks using hnsw (embedding vector_cosine_ops);

-- ----------------------------------------------------------------------------
-- 6. updated_at triggers
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','users','engagements','documents','interviews',
    'stakeholders','systems','processes','opportunities','scores',
    'roi_models','deliverables'
  ] loop
    execute format(
      'create trigger trg_touch_%1$s before update on public.%1$s
         for each row execute function app.touch_updated_at();', t);
  end loop;
end $$;

-- =============================================================================
-- 7. ROW LEVEL SECURITY
-- =============================================================================
-- Strategy (default-deny, tenant-isolated, role-gated writes):
--   * RLS enabled on every table; the app connects as the `authenticated` role
--     (never the table owner), so enabling is sufficient to enforce policies.
--   * SELECT: row.organization_id = auth.org_id()  → tenant isolation.
--   * INSERT/UPDATE/DELETE: same-tenant AND auth.can_write() (owner/admin/member).
--     'viewer' is read-only across domain data.
--   * organizations/users get tighter policies (admins manage; users see own org).
--   * The service-role key BYPASSES RLS entirely and is used only server-side by
--     Clerk webhooks + ingestion jobs (see architecture §8). No client ever holds it.
--
-- Helper to cut boilerplate: one SELECT + one ALL(write) policy per domain table.

alter table public.organizations            enable row level security;
alter table public.users                    enable row level security;
alter table public.engagements              enable row level security;
alter table public.documents                enable row level security;
alter table public.chunks                   enable row level security;
alter table public.interviews               enable row level security;
alter table public.answers                  enable row level security;
alter table public.stakeholders             enable row level security;
alter table public.systems                  enable row level security;
alter table public.processes                enable row level security;
alter table public.opportunities            enable row level security;
alter table public.scores                   enable row level security;
alter table public.roi_models               enable row level security;
alter table public.evidence_links           enable row level security;
alter table public.deliverables             enable row level security;
alter table public.recommendation_feedback  enable row level security;
alter table public.agent_runs               enable row level security;

-- 7.1 organizations — a member sees their own org; only owner/admin may update it.
create policy org_select on public.organizations
  for select using (id = auth.org_id());
create policy org_update on public.organizations
  for update using (id = auth.org_id() and auth.org_role() in ('owner','admin'))
  with check (id = auth.org_id());
-- (insert/delete of organizations happens via service-role in the Clerk webhook.)

-- 7.2 users — everyone in the org can see the member list; a user may update their
--     own profile; owner/admin may manage any member in the org.
create policy users_select on public.users
  for select using (organization_id = auth.org_id());
create policy users_update_self on public.users
  for update using (organization_id = auth.org_id() and clerk_user_id = auth.clerk_user())
  with check (organization_id = auth.org_id());
create policy users_admin_write on public.users
  for all using (organization_id = auth.org_id() and auth.org_role() in ('owner','admin'))
  with check (organization_id = auth.org_id() and auth.org_role() in ('owner','admin'));

-- 7.3 Domain tables — uniform pattern: read within tenant, write if can_write().
--     Generated below to keep the 15 domain tables perfectly consistent.
do $$
declare t text;
begin
  foreach t in array array[
    'engagements','documents','chunks','interviews','answers','stakeholders',
    'systems','processes','opportunities','scores','roi_models','evidence_links',
    'deliverables','recommendation_feedback','agent_runs'
  ] loop
    -- SELECT: any member of the tenant
    execute format($f$
      create policy %1$s_select on public.%1$s
        for select using (organization_id = auth.org_id());
    $f$, t);
    -- INSERT: same tenant + writer role
    execute format($f$
      create policy %1$s_insert on public.%1$s
        for insert with check (organization_id = auth.org_id() and auth.can_write());
    $f$, t);
    -- UPDATE: same tenant + writer role
    execute format($f$
      create policy %1$s_update on public.%1$s
        for update using (organization_id = auth.org_id() and auth.can_write())
        with check (organization_id = auth.org_id() and auth.can_write());
    $f$, t);
    -- DELETE: same tenant + writer role
    execute format($f$
      create policy %1$s_delete on public.%1$s
        for delete using (organization_id = auth.org_id() and auth.can_write());
    $f$, t);
  end loop;
end $$;

-- =============================================================================
-- 8. STORAGE (documents bucket) — RLS on storage.objects
-- =============================================================================
-- Bucket 'documents' is private. Object path convention:
--   {organization_id}/{engagement_id}/{document_id}/{filename}
-- The first path segment is the tenant; policies compare it to auth.org_id().
--
--   insert into storage.buckets (id, name, public) values ('documents','documents', false);
--
-- create policy "docs read within tenant" on storage.objects
--   for select using (
--     bucket_id = 'documents'
--     and (storage.foldername(name))[1] = auth.org_id()::text
--   );
-- create policy "docs write within tenant" on storage.objects
--   for insert with check (
--     bucket_id = 'documents'
--     and (storage.foldername(name))[1] = auth.org_id()::text
--     and auth.can_write()
--   );
-- (update/delete mirror the insert predicate.)

-- =============================================================================
-- End of schema. Phase 1 derives supabase/migrations/*.sql from this file.
-- =============================================================================

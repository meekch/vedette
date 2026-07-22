# Vedette — Claude Code Operating Instructions

Read this file every session. Read `docs/CHARTER.md` before any architectural or product decision. Read `docs/DECISIONS.md` (the index of ADRs in `docs/adr/`) before touching the stack. Follow the current phase only.

## What this is

An AI transformation intelligence platform: guided discovery, knowledge ingestion, opportunity scoring with visible evidence, ROI modeling, and executive-ready deliverables. Built by a working AI consultant to run real client engagements — dogfooding is a hard requirement, demo polish comes second.

Primary users: Forward Deployed Engineers / AI consultants (builder mode) and the executives they present to (deliverable consumers).

## Current phase

**Phase 1 — Thin Foundation + Demo Company.** Application code permitted (foundation only). See `docs/PHASES.md`. (Phase 0 closed: architecture, schema v1.1, ADRs 001–005, dogfood checkpoint recorded.)

Update this line when a phase completes. Never work ahead of the current phase without being asked.

## Stack (pinned — do not substitute or add without an ADR)

- Next.js (App Router) + TypeScript + React
- Tailwind CSS + shadcn/ui
- Supabase: Postgres, pgvector, storage, RLS. Supabase client is the data access layer. **No Prisma.** (ADR-001)
- Clerk for auth. (ADR-002)
- Vercel AI SDK for all model calls and agent orchestration. **No LangGraph/LangSmith unless an ADR adds them.** (ADR-003)
- Three agents, not nine: Discovery, Analysis & Scoring, Executive Synthesis — with a critic pass. Other "agent" roles are prompt perspectives inside these three. (ADR-004)
- React Flow (process/system maps), Recharts (dashboards)
- Vercel deployment, GitHub Actions CI

## Conventions

- Server components by default; client components only for interactivity.
- All AI outputs that make claims must carry evidence references (document chunk IDs or interview answer IDs). Never render a score or recommendation without its evidence trail. Assumptions are labeled as assumptions in the UI.
- ROI math is deterministic and inspectable: LLMs propose inputs (hours, frequency, adoption %), TypeScript computes the numbers, the UI exposes editable assumptions. LLMs never emit dollar figures directly.
- Zod schemas for all AI structured outputs and API boundaries.
- No client-side secrets. RLS on every table. Multi-tenant by `organization_id` from day one.
- Demo data lives in `/seed` and must load with one command. The demo company is **Meridian Field Services** (fictional, ~400-person mid-market facilities company) — keep its narrative internally consistent.
- Commit style: conventional commits. Each phase ends with a tagged release and an updated `docs/PHASES.md` checklist.

## Definition of done (every phase)

1. Acceptance criteria in `docs/PHASES.md` all pass.
2. Seed/demo path works end to end from a fresh clone.
3. Lint, typecheck, and existing tests pass.
4. README updated if setup changed.
5. Dogfood checkpoint noted (what real engagement or realistic dry run exercised this phase, and what it revealed).

## Out of scope until explicitly scheduled

External integrations (M365, Salesforce, Jira, etc.) — stub as "coming soon" panels. Scenario planning engine. Continuous-learning feedback loop beyond simple accept/reject tracking. Anything not in the current phase.

# Build Phases — Vedette

Each phase = one focused Claude Code session (or a few). A phase is not done until its acceptance criteria and dogfood checkpoint are met. Save as `docs/PHASES.md`.

---

## Phase 0 — Architecture & Decisions (no code)

**Session prompt:**
> Read CLAUDE.md and docs/CHARTER.md. Act as technical lead. Produce: system architecture (mermaid), full database schema with RLS strategy, the three-agent orchestration design using Vercel AI SDK, folder structure, and ADRs 001–004 written out with tradeoffs. Do not write application code. Challenge anything in the charter that conflicts with the pinned stack.

**Acceptance:** Architecture doc + schema + ADRs reviewed by me. Schema covers: organizations, users, engagements, documents, chunks (pgvector), interviews, answers, processes, systems, stakeholders, opportunities, scores, evidence_links, deliverables, recommendation_feedback.

**Dogfood checkpoint:** Walk the schema against my last real discovery engagement — can every artifact from that engagement live in this model?

---

## Phase 1 — Thin Foundation + Demo Company (1–2 days max)

**Session prompt:**
> Implement the foundation only: Next.js App Router scaffold, Clerk auth with org support, Supabase schema migration from Phase 0, shadcn design system with an enterprise theme, core navigation shell, Vercel deploy, GitHub Actions (lint/typecheck/test). Then build the Meridian Field Services seed: org chart, 6–8 realistic documents (SOPs, a messy process doc, support ticket export, meeting transcript), stakeholders, and known pain points. One command loads it all.

**Acceptance:** Fresh clone → env vars → seed → sign in → navigate a populated (empty-of-AI) workspace. Deployed.

**Dogfood checkpoint:** N/A (infrastructure), but demo narrative reviewed for realism — would a client recognize this company?

---

## Phase 2 — Knowledge Engine (core loop, part 1)

**Session prompt:**
> Implement document ingestion: upload to Supabase storage, parsing (pdf/docx/txt/csv), chunking, pgvector embeddings, and extraction of entities (people, systems, processes, pain points) with evidence links back to source chunks. Build the document library UI and an entity browser showing what the system learned and from where. Every extracted claim links to its source text.

**Acceptance:** Upload all Meridian seed docs → entities and processes appear with clickable evidence. Retrieval returns relevant chunks for test queries.

**Dogfood checkpoint:** Ingest (anonymized) documents from a real engagement. Note what the parser choked on — real client docs are messy; fix the top failure.

---

## Phase 3 — Discovery Workspace + Interview Tracker (core loop, part 2)

**Session prompt:**
> Build the adaptive discovery experience: the Discovery Agent conducts a structured but adaptive interview (company profile, objectives, processes, pain points, data availability, constraints), asks follow-ups based on prior answers and ingested knowledge, flags gaps, and requests supporting documents. Build the FDE-facing interview tracker: sessions per stakeholder, coverage map of discovery areas, confidence indicators per area. Answers become evidence objects.

**Acceptance:** Run a full discovery for Meridian; coverage map fills; agent asks at least some follow-ups grounded in ingested documents ("Your SOP mentions a 3-step approval — who owns step 2?").

**Dogfood checkpoint:** Use the tracker live (or immediately after) a real stakeholder call. This is the feature I open most — it must be fast to drive during a conversation.

---

## Phase 4 — Opportunity Scoring + ROI (core loop, part 3)

**Session prompt:**
> Implement the Analysis & Scoring Agent: generate candidate AI opportunities from knowledge + discovery, score on impact, effort, complexity, risk, data availability, adoption likelihood, strategic alignment, time to value. Every score dimension shows its evidence and its assumptions, visually distinguished. ROI model: agent proposes inputs (hours/week, frequency, loaded cost, adoption ramp), deterministic TypeScript computes savings, all assumptions editable with live recalculation. Build the opportunity backlog UI with a prioritization matrix (impact × effort scatter, Recharts).

**Acceptance:** Meridian produces 8–12 scored opportunities; changing an ROI assumption recalculates instantly; every score is traceable to evidence; assumptions are never rendered as facts.

**Dogfood checkpoint:** Score a real engagement's opportunities. Compare against my manual judgment — where the tool disagrees with me, decide which is wrong and adjust prompts or weights. Log it in recommendation_feedback.

---

## Phase 5 — Executive Deliverables (core loop, part 4)

**Session prompt:**
> Implement the Executive Synthesis Agent with a critic pass: generate the Executive AI Transformation Brief (current state, readiness, top opportunities with ROI, risk, 90-day plan, 12-month roadmap) from the knowledge base — never from thin air. Every claim cites evidence; assumptions are flagged inline. Polished in-app view + PDF export. Executive dashboard: readiness score, opportunity matrix, projected ROI timeline.

**Acceptance:** One click on Meridian → a brief I would genuinely show a client without rewriting. PDF export works. Dashboard reads clean on a laptop and projector.

**Dogfood checkpoint:** Generate a brief for a real engagement. Time it: manual synthesis hours vs. tool hours. **Record the number — this is the interview stat.**

---

## Phase 6 — Portfolio Hardening (before applying / demoing)

**Session prompt:**
> Portfolio pass: README with architecture diagram and 3-minute demo script, ADRs finalized, tests for scoring math and ingestion pipeline, security review (RLS audit, secret handling), landing page explaining the product, anonymized case study page, Loom-able demo path from seed data.

**Acceptance:** A hiring manager can clone, seed, and reach the executive brief in under 10 minutes — or watch the deployed demo in 3.

---

## Backlog (documented, not built)

Scenario planning engine · external integrations (M365, Salesforce, Jira, ServiceNow) · continuous learning loop · presentation (pptx) generator · multi-engagement analytics. Listed in README as roadmap — scoping discipline is part of the portfolio story.

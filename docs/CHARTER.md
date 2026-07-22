# Vedette — Product Charter

> **How to read this document.** This is the north-star product vision for **Vedette**, an AI Transformation Intelligence Platform. It describes the full ambition of the product. It is a **reference, not a build command** — the build order lives in `docs/PHASES.md`, and the pinned technical decisions live in `CLAUDE.md`. **Where this charter conflicts with CLAUDE.md, CLAUDE.md wins.** Known overrides: Supabase client as the data layer (no Prisma); Clerk for auth; Vercel AI SDK only (no LangGraph/LangSmith without an ADR); three agents with a critic pass, not nine (the other agent roles below are prompt perspectives inside those three); ROI math is deterministic TypeScript — LLMs propose inputs, never dollar figures. Items marked as future scope (integrations, scenario planning, continuous learning) are backlog until explicitly scheduled.

---

## The Name

**Vedette**: a mounted sentry posted forward of an army's lines — the furthest-deployed set of eyes, whose job is to see what the force behind her cannot, and report back what's true. The product does for organizations what the vedette does for the army: it is deployed forward into the organization's documents, workflows, and people, sees the opportunities and risks that everyday vantage points miss, and reports back with evidence.

Release codenames are birds of prey, beginning with **v1.0 "Kestrel"** — a falcon that hunts by perceiving ultraviolet trails invisible to human eyes.

## Mission

Build a portfolio-quality AI Transformation Intelligence Platform that demonstrates the capabilities expected from elite AI companies such as OpenAI, Anthropic, Palantir, Databricks, Stripe, and GitLab — and that works as a real tool on real consulting engagements.

The objective is to solve one of the biggest enterprise AI adoption problems:

**Organizations know AI matters, but they struggle to identify where AI will create the highest business value, how to prioritize initiatives, how to measure ROI, and how to implement safely.**

Vedette becomes an intelligence layer that helps organizations discover, prioritize, plan, and execute AI transformation initiatives.

The final product should create a "wow" executive experience. A CEO, CIO, CTO, or business leader should immediately understand the value. A hiring manager for a Forward Deployed Engineer role should see evidence of enterprise discovery, AI strategy, architecture, implementation planning, and customer impact.

## Product Vision

Create an AI Transformation Intelligence Platform that continuously builds organizational understanding through:

- Guided discovery interviews
- Enterprise knowledge ingestion
- Document analysis
- Workflow analysis
- System mapping
- Business process intelligence
- AI opportunity scoring
- ROI modeling
- Implementation planning
- Continuous improvement through feedback

The platform should work for Fortune 500 enterprises, mid-size organizations, small businesses, individual departments, and specific business functions. The system should adapt based on company size, industry, maturity, goals, and constraints.

## Core Problem

Organizations struggle with:

- Knowing where AI delivers the highest ROI
- Identifying inefficient workflows
- Understanding automation opportunities
- Prioritizing competing AI ideas
- Measuring business impact
- Managing security and governance concerns
- Creating an implementation roadmap

Vedette solves this through **evidence-based AI transformation planning**.

## Technology Stack

See `CLAUDE.md` for the pinned, authoritative stack. Summary: Next.js (App Router), TypeScript, React, Tailwind CSS, shadcn/ui, Supabase (Postgres + pgvector + storage + RLS, Supabase client as data layer), Clerk authentication, Vercel AI SDK for all model calls and agent orchestration, React Flow, Recharts, Vercel deployment, GitHub Actions CI.

Use production architecture with clean separation between frontend, backend, AI orchestration, data layer, knowledge layer, authentication, and analytics.

## Enterprise Knowledge Engine

A knowledge ingestion system. Users upload:

SOPs, process documentation, meeting transcripts, policies, organization charts, architecture diagrams, reports, presentations, spreadsheets, workflow documents, customer feedback, support tickets, and existing automation documentation.

Future integrations (backlog): Microsoft 365, SharePoint, Teams, Google Workspace, Salesforce, ServiceNow, Jira, Confluence.

The system should:

- Extract entities
- Identify business processes
- Map systems
- Identify stakeholders and dependencies
- Detect repetitive work and bottlenecks
- Identify automation opportunities
- Build organizational context

Create a semantic knowledge layer connecting people, departments, processes, systems, documents, goals, pain points, AI opportunities, and recommendations. Every extracted claim links back to its source (document chunk or interview answer).

## Intelligent Discovery Experience

Not a basic questionnaire — an adaptive AI discovery consultant that:

- Asks intelligent follow-up questions
- Adjusts questions based on previous answers
- Identifies missing information
- Requests supporting documentation
- Increases confidence before making recommendations

Discovery areas: company profile, business objectives, strategic priorities, department structure, technology environment, current AI adoption, business processes, manual workflows, approval processes, data availability, security requirements, compliance needs, employee pain points, customer experience challenges, revenue opportunities, and cost reduction opportunities.

## AI Opportunity Intelligence Engine

Analyze opportunities using: business impact, ROI potential, implementation effort, technical complexity, risk, data availability, user adoption likelihood, strategic alignment, time to value, and executive priority.

Generate: AI Opportunity Score, Automation Priority Score, AI Readiness Score, ROI Estimate, Risk Rating, and Implementation Complexity Rating.

Every score dimension shows its evidence and its assumptions, visually distinguished. Assumptions are never rendered as facts.

## Agent Architecture

Three agents with a critic pass (per ADR-004): **Discovery**, **Analysis & Scoring**, and **Executive Synthesis**.

The following specialist roles are prompt perspectives applied inside those three agents, not separate agents: Business Analyst, Process Intelligence, AI Solutions Architect, Automation, Security & Governance, ROI Analyst, Executive Communications, and Implementation Planning. The critic pass reviews recommendations before final output.

## Executive Experience

Generate executive-ready deliverables, including:

Executive AI Transformation Brief, Current State Assessment, AI Readiness Assessment, Top AI Opportunities, ROI Analysis, Cost Savings Model, Revenue Impact Model, Risk Assessment, 90-Day Implementation Plan, 12-Month AI Roadmap, Technology Architecture, Workflow Diagrams, Business Case Presentation, Board-Level Summary, Change Management Plan, Success Metrics, KPIs, and OKRs.

Every claim in a deliverable cites evidence; assumptions are flagged inline. Deliverables are generated from the knowledge base — never from thin air.

## Scenario Planning (backlog)

Allow executives to test scenarios — "What if we focus on cost reduction?", "What if we focus on customer experience?", "What if we automate employee workflows?", "What if we invest $1M in AI over 12 months?" — generating different transformation paths based on strategic goals. Documented as roadmap; not built until explicitly scheduled.

## Forward Deployed Engineer Mode

A mode designed for AI consultants and technical leaders:

- Customer discovery workspace
- Stakeholder interview tracker
- Opportunity backlog
- Architecture recommendations
- Implementation tracker
- ROI validation
- Executive presentation generator
- Technical handoff documentation

Vedette should enhance Forward Deployed Engineers by reducing discovery effort and increasing the quality of recommendations. The core success metric: **manual discovery-to-brief time vs. tool time**, measured on real engagements at Phase 5.

## Continuous Improvement (simple form first)

The platform improves through user feedback, accepted/rejected recommendations, implementation results, ROI validation, and new organizational data. Track which recommendations worked, which failed, which assumptions were incorrect, and how scoring should improve. (Phase scope: simple accept/reject tracking in `recommendation_feedback`; the full learning loop is backlog.)

Maintain transparency. **Never present assumptions as facts. Always show evidence behind recommendations.**

## Portfolio Quality Requirements

The final application should include: premium enterprise design, responsive experience, demo company data (Meridian Field Services), sample executive reports, architecture diagrams, interactive dashboards, testing, documentation, deployment instructions, CI/CD, and security practices.

The final result should feel like an internal AI transformation product used by a leading consulting organization.

The goal is not to build a chatbot. The goal is to build an AI-powered transformation intelligence system that helps organizations decide where AI creates measurable business value and how to execute successfully.

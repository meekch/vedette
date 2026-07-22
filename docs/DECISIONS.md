# Vedette — Decisions Index

A one-line ruling per Architecture Decision Record. The full context, tradeoffs,
and alternatives for each live in [`docs/adr/`](adr/). Read this page for *what*
was decided; read the ADR for *why*. Pinned stack rules also live in `CLAUDE.md`.

| ADR | Title | Ruling |
|-----|-------|--------|
| [001](adr/ADR-001.md) | Data access layer | The Supabase client is the data layer; **no Prisma / no ORM**. RLS stays authoritative; queries are hand-written and typed. |
| [002](adr/ADR-002.md) | Authentication | **Clerk** for auth + organizations, integrated as a Supabase third-party auth provider; the JWT `org_id` claim drives RLS. |
| [003](adr/ADR-003.md) | AI orchestration | **Vercel AI SDK** for all model calls and orchestration; **no LangGraph / LangChain / LangSmith** without a superseding ADR. |
| [004](adr/ADR-004.md) | Agent architecture | **Three agents + a critic pass** (Discovery, Analysis & Scoring, Executive Synthesis), not nine; specialist roles are prompt perspectives inside the three. |
| [005](adr/ADR-005.md) | Embedding model | **OpenAI `text-embedding-3-small`**, `vector(1536)`, cosine (`vector_cosine_ops`), via the AI SDK; **Voyage AI** is the documented upgrade path if Phase 2 retrieval is weak. |

## Adding a decision

1. Copy the format of an existing ADR into `docs/adr/ADR-00N.md`.
2. Add a row to the table above.
3. If it changes the pinned stack, update `CLAUDE.md`.
4. A decision that reverses an earlier one **supersedes** it — mark the old ADR's status and note the successor.

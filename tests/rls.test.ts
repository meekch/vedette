import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });

/**
 * RLS zero-leak test — `docs/PHASES.md` Phase 1, step 5.
 *
 * "RLS enabled" is a flag on a table; it proves nothing about whether the
 * policies actually deny. This connects as the same `authenticated` role a
 * signed-in browser client uses, with no org claim, and asserts it can see
 * nothing. Multi-tenancy is the property that is most expensive to get wrong and
 * least visible when it is wrong, so it gets a test rather than an assurance.
 *
 * Skipped when DATABASE_URL is unset, so a fresh clone and CI stay green without
 * database credentials. That is a deliberate trade: this suite is a local and
 * pre-deploy gate, not a CI gate.
 */

const DATABASE_URL = process.env.DATABASE_URL?.trim();
const describeIfDb = DATABASE_URL ? describe : describe.skip;

/** Every table that carries tenant data and must never leak. */
const TENANT_TABLES = [
  "organizations",
  "users",
  "engagements",
  "documents",
  "chunks",
  "stakeholders",
  "interviews",
  "answers",
  "systems",
  "processes",
  "opportunities",
  "scores",
  "evidence_links",
  "roi_models",
  "deliverables",
  "recommendation_feedback",
  "agent_runs",
  "interview_participants",
] as const;

describeIfDb("RLS zero-leak", () => {
  let client: Client;

  beforeAll(async () => {
    client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 20_000,
    });
    await client.connect();
  }, 30_000);

  afterAll(async () => {
    await client?.end();
  });

  it("enables RLS on every tenant table", async () => {
    const { rows } = await client.query<{ table: string; rls: boolean }>(
      `select c.relname as table, c.relrowsecurity as rls
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r'`,
    );
    const off = rows.filter((r) => !r.rls).map((r) => r.table);
    expect(off).toEqual([]);
    expect(rows.length).toBeGreaterThanOrEqual(17);
  });

  it("gives every tenant table at least one policy", async () => {
    const { rows } = await client.query<{ tablename: string; n: string }>(
      `select tablename, count(*) as n from pg_policies
        where schemaname = 'public' group by tablename`,
    );
    const withPolicies = new Set(rows.map((r) => r.tablename));
    const missing = TENANT_TABLES.filter((t) => !withPolicies.has(t));
    expect(missing).toEqual([]);
  });

  it("returns no rows to an authenticated caller with no org claim", async () => {
    // Seed inside a transaction and roll back, so the live database is unchanged
    // whether the test passes or fails.
    await client.query("begin");
    try {
      await client.query(
        `insert into public.organizations (name, clerk_org_id)
           values ('RLS probe (rolled back)', 'org_probe_test')`,
      );

      const owner = await client.query<{ n: string }>(
        "select count(*)::int as n from public.organizations",
      );
      expect(Number(owner.rows[0].n)).toBe(1);

      await client.query("set local role authenticated");

      const orgId = await client.query<{ no_org: boolean }>(
        "select app.org_id() is null as no_org",
      );
      expect(orgId.rows[0].no_org).toBe(true);

      const leaked = await client.query<{ n: string }>(
        "select count(*)::int as n from public.organizations",
      );
      expect(Number(leaked.rows[0].n)).toBe(0);

      await client.query("reset role");
    } finally {
      await client.query("rollback");
    }
  }, 30_000);

  it("lets the authenticated role reach the tenancy helpers", async () => {
    // A policy that cannot execute its own helper fails closed, which looks
    // identical to correct isolation — and would make the test above pass for
    // entirely the wrong reason.
    const { rows } = await client.query<{ authed: boolean; anon: boolean }>(
      `select has_schema_privilege('authenticated','app','USAGE') as authed,
              has_schema_privilege('anon','app','USAGE') as anon`,
    );
    expect(rows[0].authed).toBe(true);
    expect(rows[0].anon).toBe(true);
  });
});

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — **BYPASSES RLS**. Server-only.
 *
 * Per docs/architecture.md §8/§309 this is confined to two trusted contexts:
 *   1. The Clerk webhook (`/api/webhooks/clerk`) mirroring orgs/users.
 *   2. Background jobs: ingestion (Phase 2) and the demo seed loader.
 *
 * It must NEVER be imported into a client component or reach the browser — the
 * `server-only` import above makes such a build fail. Reads/writes on behalf of
 * a signed-in user go through the user-scoped client (added with Clerk, step 2),
 * which carries the Clerk JWT so RLS is the enforcement boundary.
 */
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "createServiceClient: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

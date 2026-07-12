/**
 * Single Supabase admin client factory.
 * All other modules import from here — no more duplicated getSupabase() helpers.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/config/env";

let _client: SupabaseClient | null = null;

/**
 * Returns the shared Supabase admin client (service-role).
 * Returns null if env vars are not configured (degraded mode).
 */
export function getDb(): SupabaseClient | null {
  if (_client) return _client;
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

/**
 * Returns the shared client, throwing if not configured.
 * Use in contexts where the DB MUST be available.
 */
export function db(): SupabaseClient {
  const client = getDb();
  if (!client) throw new Error("Database not configured — check SUPABASE env vars");
  return client;
}

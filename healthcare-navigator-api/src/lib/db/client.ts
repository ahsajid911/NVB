/**
 * Supabase client factory.
 * - getDb()/db() → service-role client (admin operations, bypasses RLS)
 * - getAnonDb()/anonDb() → anon client (public routes, respects RLS)
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/config/env";

let _client: SupabaseClient | null = null;
let _anonClient: SupabaseClient | null = null;

/**
 * Returns the shared Supabase admin client (service-role).
 * Use ONLY for admin operations that need to bypass RLS.
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
 * Returns the shared admin client, throwing if not configured.
 */
export function db(): SupabaseClient {
  const client = getDb();
  if (!client) throw new Error("Database not configured — check SUPABASE env vars");
  return client;
}

/**
 * Returns the anon client (uses anon key, respects RLS).
 * Use for public-facing routes (doctor listing, search, etc.).
 */
export function getAnonDb(): SupabaseClient | null {
  if (_anonClient) return _anonClient;
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _anonClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _anonClient;
}

/**
 * Returns the anon client, throwing if not configured.
 */
export function anonDb(): SupabaseClient {
  const client = getAnonDb();
  if (!client) throw new Error("Anon DB not configured — check NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return client;
}

import { ProviderConfig, ApiKeyEntry, DEFAULT_PROVIDERS } from "./types";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/crypto";

let _sb: SupabaseClient | null = null;
function getSupabase() {
  if (_sb) return _sb;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _sb = createClient(url, key);
  return _sb;
}

let _providers: ProviderConfig[] | null = null;
let _apiKeys: ApiKeyEntry[] | null = null;

async function ensureProviders(): Promise<ProviderConfig[]> {
  if (_providers) return _providers;
  const sb = getSupabase();
  if (!sb) { _providers = [...DEFAULT_PROVIDERS]; return _providers; }
  try {
    const { data, error } = await sb.from("ai_providers").select("*").order("priority");
    if (error || !data || data.length === 0) {
      for (const p of DEFAULT_PROVIDERS) {
        await sb.from("ai_providers").upsert({
          id: p.id, provider: p.provider, enabled: p.enabled, priority: p.priority,
          model: p.model, temperature: p.temperature, timeout: p.timeout, max_tokens: p.maxTokens,
        }, { onConflict: "provider" });
      }
      _providers = [...DEFAULT_PROVIDERS];
    } else {
      _providers = data.map((r: any) => ({
        id: r.id, provider: r.provider, enabled: r.enabled, priority: r.priority,
        model: r.model, temperature: r.temperature, timeout: r.timeout, maxTokens: r.max_tokens,
      }));
    }
  } catch {
    _providers = [...DEFAULT_PROVIDERS];
  }
  return _providers!;
}

async function ensureApiKeys(): Promise<ApiKeyEntry[]> {
  if (_apiKeys) return _apiKeys;
  const sb = getSupabase();
  if (!sb) { _apiKeys = []; return _apiKeys; }
  try {
    const { data, error } = await sb.from("ai_api_keys").select("*").order("priority");
    if (error || !data) {
      console.error("[AI Config] api_keys read error:", error?.message);
      _apiKeys = [];
    } else {
      _apiKeys = data.map((r: any) => ({
        id: r.id, providerId: r.provider_id,
        // Decrypt on read; gracefully returns the plaintext value for legacy rows.
        encryptedKey: decrypt(r.encrypted_key),
        active: r.active, priority: r.priority,
        lastUsed: r.last_used, rateLimitedUntil: r.rate_limited_until,
      }));
    }
  } catch (err: any) {
    console.error("[AI Config] api_keys catch:", err.message);
    _apiKeys = [];
  }
  return _apiKeys!;
}

export async function getProviders(): Promise<ProviderConfig[]> { return ensureProviders(); }
export async function getApiKeys(): Promise<ApiKeyEntry[]> { return ensureApiKeys(); }

export function clearCache() { _providers = null; _apiKeys = null; }

export async function setProviders(providers: ProviderConfig[]): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Database unavailable");
  for (const p of providers) {
    await sb.from("ai_providers").upsert({
      id: p.id, provider: p.provider, enabled: p.enabled, priority: p.priority,
      model: p.model, temperature: p.temperature, timeout: p.timeout, max_tokens: p.maxTokens,
    }, { onConflict: "provider" });
  }
  _providers = null;
  await ensureProviders();
}

export async function addApiKey(key: ApiKeyEntry): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Database unavailable");
  const { error } = await sb.from("ai_api_keys").insert({
    id: key.id, provider_id: key.providerId, encrypted_key: key.encryptedKey,
    active: key.active, priority: key.priority,
  });
  if (error) {
    console.error("[AI Config] addApiKey error:", error.message);
    throw new Error(error.message);
  }
  _apiKeys = null;
}

export async function removeApiKey(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Database unavailable");
  const { error } = await sb.from("ai_api_keys").delete().eq("id", id);
  if (error) throw new Error(error.message);
  _apiKeys = null;
}

export async function updateApiKey(id: string, updates: Partial<ApiKeyEntry>): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Database unavailable");
  const dbUpdates: any = {};
  if (updates.active !== undefined) dbUpdates.active = updates.active;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.lastUsed !== undefined) dbUpdates.last_used = updates.lastUsed;
  if (updates.rateLimitedUntil !== undefined) dbUpdates.rate_limited_until = updates.rateLimitedUntil;
  const { error } = await sb.from("ai_api_keys").update(dbUpdates).eq("id", id);
  if (error) throw new Error(error.message);
  _apiKeys = null;
}

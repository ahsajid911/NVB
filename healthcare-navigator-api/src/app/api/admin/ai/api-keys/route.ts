import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getApiKeys, addApiKey } from "@/lib/ai/config";
import { validateApiKeyFormat } from "@/lib/ai/types";
import { requireAdminPermission } from "@/lib/requireAdmin";
import { encrypt } from "@/lib/crypto";

function maskKey(key: string): string {
  if (key.length <= 12) return key.substring(0, 4) + "..." + key.substring(key.length - 2);
  return key.substring(0, 6) + "..." + key.substring(key.length - 4);
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminPermission(request, "manage", "ai");
  if (!auth.ok) return auth.response;

  try {
    const keys = await getApiKeys();
    // Mask the stored key for display — never return a usable key over the API.
    const safe = keys.map((k) => ({
      id: k.id, providerId: k.providerId, encryptedKey: maskKey(k.encryptedKey),
      active: k.active, priority: k.priority, lastUsed: k.lastUsed, rateLimitedUntil: k.rateLimitedUntil,
    }));
    return NextResponse.json(safe);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminPermission(request, "manage", "ai");
  if (!auth.ok) return auth.response;

  try {
    const { providerId, key, priority } = await request.json();
    if (!providerId || !key || typeof key !== "string") {
      return NextResponse.json({ error: "providerId and key are required" }, { status: 400 });
    }
    if (key.length < 10) {
      return NextResponse.json({ error: "API key appears too short" }, { status: 400 });
    }

    const providers = await import("@/lib/ai/config").then((m) => m.getProviders());
    const providerConfig = providers.find((p) => p.id === providerId);
    if (providerConfig && !validateApiKeyFormat(providerConfig.provider, key)) {
      return NextResponse.json({ error: `Key format looks wrong for ${providerConfig.provider}` }, { status: 400 });
    }

    const entry = {
      id: randomUUID(), providerId, encryptedKey: encrypt(key), active: true, priority: priority || 1,
      lastUsed: null, rateLimitedUntil: null,
    };
    await addApiKey(entry);

    return NextResponse.json({
      id: entry.id, providerId: entry.providerId, encryptedKey: maskKey(key),
      active: entry.active, priority: entry.priority,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

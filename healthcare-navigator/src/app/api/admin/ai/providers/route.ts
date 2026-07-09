import { NextRequest, NextResponse } from "next/server";
import { getProviders, setProviders } from "@/lib/ai/config";
import { validateModelName } from "@/lib/ai/types";
import { requireAdminPermission } from "@/lib/requireAdmin";

export async function GET(request: NextRequest) {
  const auth = await requireAdminPermission(request, "read", "ai");
  if (!auth.ok) return auth.response;

  try {
    const providers = await getProviders();
    return NextResponse.json(providers);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminPermission(request, "manage", "ai");
  if (!auth.ok) return auth.response;

  try {
    const { providers } = await request.json();
    if (!Array.isArray(providers)) {
      return NextResponse.json({ error: "providers array is required" }, { status: 400 });
    }
    for (const p of providers) {
      if (!p.id || !p.provider || !p.model) {
        return NextResponse.json({ error: "Invalid provider config: missing id/provider/model" }, { status: 400 });
      }
      if (!validateModelName(p.provider, p.model)) {
        return NextResponse.json({ error: `Invalid model "${p.model}" for provider "${p.provider}"` }, { status: 400 });
      }
    }
    await setProviders(providers);
    return NextResponse.json({ success: true, providers: await getProviders() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

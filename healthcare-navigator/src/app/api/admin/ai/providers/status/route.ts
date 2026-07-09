import { NextRequest, NextResponse } from "next/server";
import { getProviderStatus } from "@/lib/ai/providerManager";
import { requireAdminPermission } from "@/lib/requireAdmin";

export async function GET(request: NextRequest) {
  const auth = await requireAdminPermission(request, "read", "ai");
  if (!auth.ok) return auth.response;

  try {
    const status = await getProviderStatus();
    return NextResponse.json(status);
  } catch {
    return NextResponse.json([]);
  }
}

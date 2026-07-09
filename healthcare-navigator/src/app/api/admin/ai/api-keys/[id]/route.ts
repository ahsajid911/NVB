import { NextRequest, NextResponse } from "next/server";
import { getApiKeys, updateApiKey, removeApiKey } from "@/lib/ai/config";
import { requireAdminPermission } from "@/lib/requireAdmin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminPermission(request, "manage", "ai");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  try {
    const body = await request.json();
    const keys = await getApiKeys();
    const key = keys.find((k) => k.id === id);
    if (!key) return NextResponse.json({ error: "Key not found" }, { status: 404 });

    const updates: any = {};
    if (body.active !== undefined) updates.active = body.active;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (Object.keys(updates).length > 0) {
      await updateApiKey(id, updates);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminPermission(request, "manage", "ai");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  try {
    await removeApiKey(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

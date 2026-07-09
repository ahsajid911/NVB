import { NextRequest, NextResponse } from "next/server";
import { validateSession, hasPermission } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "read", "admins")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { getAllAdmins } = await import("@/lib/adminApi");
    const admins = await getAllAdmins();
    return NextResponse.json({ admins });
  } catch {
    return NextResponse.json({ admins: [{ id: user.id, username: user.username, email: user.email, role: user.role, is_active: true }] });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "create", "admins")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { createAdmin } = await import("@/lib/adminApi");
    const body = await request.json();
    const admin = await createAdmin(body, user.id);
    return NextResponse.json({ admin }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create admin" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "update", "admins")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { updateAdmin } = await import("@/lib/adminApi");
    const { id, ...data } = await request.json();
    await updateAdmin(id, data, user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update admin" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "delete", "admins")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { deleteAdmin } = await import("@/lib/adminApi");
    const { id } = await request.json();
    if (id === user.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    await deleteAdmin(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete admin" }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { validateSession, hasPermission } from "@/lib/auth";
import { resetAdminPassword } from "@/lib/adminApi";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "update", "admins")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id, newPassword } = await request.json();
    await resetAdminPassword(id, newPassword, user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to reset password" }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { validateSession, hashPassword, verifyPassword, logActivity } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Both passwords required" }, { status: 400 });
  }

  // Get current password hash
  const { data: admin } = await supabaseAdmin.from("admins").select("password_hash").eq("id", user.id).single();
  if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

  const valid = await verifyPassword(currentPassword, admin.password_hash);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });

  const hash = await hashPassword(newPassword);
  await supabaseAdmin.from("admins").update({ password_hash: hash, updated_at: new Date().toISOString() }).eq("id", user.id);
  
  // Invalidate all existing sessions except the current one
  await supabaseAdmin.from("admin_sessions").delete().eq("admin_id", user.id).neq("token", token);
  
  await logActivity(user.id, "password_changed", "auth", user.id);

  return NextResponse.json({ success: true });
}

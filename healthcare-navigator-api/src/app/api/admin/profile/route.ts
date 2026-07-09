import { NextRequest, NextResponse } from "next/server";
import { validateSession, logActivity, supabaseAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let profile = null;
  try {
    const result = await supabaseAdmin
      .from("admin_profiles")
      .select("*")
      .eq("admin_id", user.id)
      .single();
    profile = result.data;
  } catch {}

  return NextResponse.json({ user, profile });
}

export async function PUT(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { full_name, bio, phone, avatar_url } = await request.json();

  try {
    await supabaseAdmin.from("admin_profiles").upsert({
      admin_id: user.id,
      full_name,
      bio,
      phone,
      avatar_url,
    }, { onConflict: "admin_id" });
  } catch {}

  try {
    await logActivity(user.id, "profile_updated", "profile", user.id);
  } catch {}

  return NextResponse.json({ success: true });
}

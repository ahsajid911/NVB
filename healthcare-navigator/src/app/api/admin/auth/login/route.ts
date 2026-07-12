import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, verifyPassword, createSession, logActivity } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { loginSchema, sanitizeFilterValue } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    // Rate limit login attempts to mitigate brute-force attacks.
    const limited = await enforceRateLimit(request, "login", { limit: 10, windowMs: 60_000 });
    if (limited) return limited;

    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { username, password } = parsed.data;

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Sanitize before interpolating into the PostgREST filter to prevent filter-injection.
    const safeUser = sanitizeFilterValue(username);
    const { data: admin, error } = await supabaseAdmin
      .from("admins")
      .select("*")
      .or(`username.eq.${safeUser},email.eq.${safeUser}`)
      .eq("is_active", true)
      .single();

    if (error || !admin) {
      // Deliberately same message for bad username and bad password to prevent enumeration
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, admin.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSession(admin.id, ipAddress, userAgent);
    await logActivity(admin.id, "login", "auth", admin.id, { username: admin.username }, ipAddress, userAgent);

    const response = NextResponse.json({
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

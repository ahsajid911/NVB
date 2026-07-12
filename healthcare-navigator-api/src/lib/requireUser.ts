import { NextRequest, NextResponse } from "next/server";
import { userAuthService } from "@/lib/services/auth.service";
import type { UserRow } from "@/lib/repositories/users.repo";

export type RequireUserResult = { ok: true; user: UserRow } | { ok: false; response: NextResponse };

/**
 * Validates the public user session token from the `user_token` cookie.
 * (Separate from admin auth which uses `admin_token`.)
 */
export async function requireUser(request: NextRequest): Promise<RequireUserResult> {
  const token = request.cookies.get("user_token")?.value;
  if (!token) return { ok: false, response: NextResponse.json({ error: { message: "Authentication required" } }, { status: 401 }) };
  const user = await userAuthService.validateSession(token);
  if (!user) return { ok: false, response: NextResponse.json({ error: { message: "Invalid or expired session" } }, { status: 401 }) };
  return { ok: true, user };
}

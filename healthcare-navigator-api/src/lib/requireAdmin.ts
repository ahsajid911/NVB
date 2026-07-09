import { NextRequest, NextResponse } from "next/server";
import { validateSession, hasPermission, AdminUser, AdminRole } from "@/lib/auth";

export interface AuthResult {
  user: AdminUser;
}

export type RequireAdminResult = { ok: true; user: AdminUser } | { ok: false; response: NextResponse };

/**
 * Validates the admin session token from the request cookie.
 * Returns the authenticated user on success, or an error response on failure.
 *
 * Usage in a route handler:
 *   const auth = await requireAdmin(request);
 *   if (!auth.ok) return auth.response;
 *   const user = auth.user;
 */
export async function requireAdmin(request: NextRequest): Promise<RequireAdminResult> {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const user = await validateSession(token);
  if (!user) return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { ok: true, user };
}

/**
 * Validates the admin session AND checks that the user has a specific permission.
 *
 * Usage:
 *   const auth = await requireAdminPermission(request, "create", "doctors");
 *   if (!auth.ok) return auth.response;
 */
export async function requireAdminPermission(
  request: NextRequest,
  permission: string,
  resource: string
): Promise<RequireAdminResult> {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth;
  if (!hasPermission(auth.user.role as AdminRole, permission, resource)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return auth;
}

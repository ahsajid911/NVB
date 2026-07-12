import { NextRequest } from "next/server";
import { validateSession, createSession, logActivity, hasPermission, supabaseAdmin } from "@/lib/auth";
import { verifyPassword } from "@/lib/auth";
import { sanitizeFilterValue } from "@/lib/validation";
import { loginSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rateLimit";
import { adminsRepo } from "@/lib/repositories/admins.repo";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { success, error } from "@/lib/utils/apiResponse";

/**
 * POST /api/v1/admin/auth/login
 * Admin login — rate-limited to 10/min, validates with zod.
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const limited = await enforceRateLimit(request, "admin-login", { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");
  }

  const { username, password } = parsed.data;
  const safeUsername = sanitizeFilterValue(username);

  // Look up admin by username or email
  const { data: admin } = await supabaseAdmin
    .from("admins")
    .select("id, username, email, password_hash, role, is_active")
    .or(`username.eq.${safeUsername},email.eq.${safeUsername}`)
    .single();

  if (!admin || !admin.is_active) {
    return error("Invalid credentials", 401, "AUTH_FAILED");
  }

  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) {
    return error("Invalid credentials", 401, "AUTH_FAILED");
  }

  const token = await createSession(admin.id);
  await logActivity(admin.id, "login", "auth", admin.id);

  const response = success({
    id: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
  });

  // Attach admin_token cookie
  response.headers.append(
    "Set-Cookie",
    `admin_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${24 * 60 * 60}`
  );

  return response;
});

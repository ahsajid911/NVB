import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { validateSession, destroySession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { success } from "@/lib/utils/apiResponse";

/**
 * POST /api/v1/admin/auth/logout
 * Admin logout — destroys session and clears cookie.
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const token = request.cookies.get("admin_token")?.value || "";
  await destroySession(token);

  const response = success({ loggedOut: true });
  response.headers.append(
    "Set-Cookie",
    "admin_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
  );
  return response;
});

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { success } from "@/lib/utils/apiResponse";

/**
 * GET /api/v1/admin/auth/me
 * Returns the currently authenticated admin's profile.
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  return success(auth.admin);
});

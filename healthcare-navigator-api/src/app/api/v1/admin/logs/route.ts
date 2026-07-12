import { NextRequest } from "next/server";
import { requireAdminPermission } from "@/lib/requireAdmin";
import { adminsRepo } from "@/lib/repositories/admins.repo";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { success } from "@/lib/utils/apiResponse";

/**
 * GET /api/v1/admin/logs — activity audit logs (paginated)
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const auth = await requireAdminPermission(request, "read", "audit_logs");
  if (!auth.ok) return auth.response;

  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const result = await adminsRepo.getActivityLogs(page);
  return success(result);
});

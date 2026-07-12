import { NextRequest } from "next/server";
import { requireAdminPermission } from "@/lib/requireAdmin";
import { adminsRepo } from "@/lib/repositories/admins.repo";
import { adminCreateSchema } from "@/lib/validation";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { success, error, paginated } from "@/lib/utils/apiResponse";
import { parsePagination } from "@/lib/utils/pagination";

/**
 * GET /api/v1/admin/admins — list admins (super_admin/admin only)
 * POST /api/v1/admin/admins — create admin
 * PUT /api/v1/admin/admins — update admin
 * DELETE /api/v1/admin/admins — delete admin
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const auth = await requireAdminPermission(request, "read", "admins");
  if (!auth.ok) return auth.response;

  const admins = await adminsRepo.findAll();
  return success({ admins });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const auth = await requireAdminPermission(request, "create", "admins");
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const parsed = adminCreateSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");
  }

  const admin = await adminsRepo.create(parsed.data, auth.admin.id);
  return success(admin, 201);
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const auth = await requireAdminPermission(request, "update", "admins");
  if (!auth.ok) return auth.response;

  const { id, ...data } = await request.json();
  if (!id) return error("Admin id is required", 400, "MISSING_PARAM");

  await adminsRepo.update(id, data, auth.admin.id);
  return success({ updated: true });
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const auth = await requireAdminPermission(request, "delete", "admins");
  if (!auth.ok) return auth.response;

  const { id } = await request.json();
  if (!id) return error("Admin id is required", 400, "MISSING_PARAM");
  if (id === auth.admin.id) return error("Cannot delete yourself", 400, "FORBIDDEN");

  await adminsRepo.delete(id, auth.admin.id);
  return success({ deleted: true });
});

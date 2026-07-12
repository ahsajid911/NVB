import { NextRequest } from "next/server";
import { specialtiesRepo } from "@/lib/repositories/specialties.repo";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { success, error } from "@/lib/utils/apiResponse";

export const GET = withErrorHandler(async (request: NextRequest, ctx: any) => {
  const { slug } = await ctx.params;
  const specialty = await specialtiesRepo.findBySlug(slug);
  if (!specialty) return error("Specialty not found", 404, "NOT_FOUND");
  return success(specialty);
});

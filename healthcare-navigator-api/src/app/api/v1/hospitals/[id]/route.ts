import { NextRequest } from "next/server";
import { hospitalsRepo } from "@/lib/repositories/hospitals.repo";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { success, error } from "@/lib/utils/apiResponse";

export const GET = withErrorHandler(async (request: NextRequest, ctx: any) => {
  const { id } = await ctx.params;
  const hospital = await hospitalsRepo.findById(id);
  if (!hospital) return error("Hospital not found", 404, "NOT_FOUND");
  return success(hospital);
});

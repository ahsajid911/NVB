import { NextRequest } from "next/server";
import { doctorsRepo } from "@/lib/repositories/doctors.repo";
import { parsePagination } from "@/lib/utils/pagination";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { success, error } from "@/lib/utils/apiResponse";

/** GET /api/v1/doctors — list all doctors (paginated) */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { page, limit, offset } = parsePagination(new URL(request.url).searchParams);
  const [doctors, total] = await Promise.all([doctorsRepo.findAll(limit, offset), doctorsRepo.count()]);
  return new Response(
    JSON.stringify({
      data: doctors,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

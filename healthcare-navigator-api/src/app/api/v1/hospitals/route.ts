import { NextRequest } from "next/server";
import { hospitalsRepo } from "@/lib/repositories/hospitals.repo";
import { parsePagination } from "@/lib/utils/pagination";
import { withErrorHandler } from "@/lib/middleware/errorHandler";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { page, limit, offset } = parsePagination(new URL(request.url).searchParams);
  const [hospitals, total] = await Promise.all([hospitalsRepo.findAll(limit, offset), hospitalsRepo.count()]);
  return new Response(
    JSON.stringify({
      data: hospitals,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

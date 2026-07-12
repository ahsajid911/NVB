import { NextRequest } from "next/server";
import { searchService } from "@/lib/services/search.service";
import { enforceRateLimit } from "@/lib/rateLimit";
import { searchFiltersSchema } from "@/lib/validation";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { error } from "@/lib/utils/apiResponse";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const limited = await enforceRateLimit(request, "search", { limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "doctors";

  if (type !== "doctors") {
    return error("Only doctor search is currently supported. Use type=doctors.", 400, "UNSUPPORTED_TYPE");
  }

  // Parse filters from query params
  const filters: Record<string, any> = {};
  const searchQuery = searchParams.get("q") || searchParams.get("query");
  if (searchQuery) filters.query = searchQuery;
  if (searchParams.get("specialty")) filters.specialty = searchParams.get("specialty")!;
  if (searchParams.get("hospital")) filters.hospital = searchParams.get("hospital")!;
  if (searchParams.get("district")) filters.district = searchParams.get("district")!;
  if (searchParams.get("gender")) filters.gender = searchParams.get("gender")!;
  if (searchParams.get("minExperience")) filters.minExperience = parseInt(searchParams.get("minExperience")!, 10);
  if (searchParams.get("maxFee")) filters.maxFee = parseInt(searchParams.get("maxFee")!, 10);
  if (searchParams.get("availableDay")) filters.availableDay = searchParams.get("availableDay")!;
  if (searchParams.get("sortBy")) filters.sortBy = searchParams.get("sortBy")!;
  if (searchParams.get("sortOrder")) filters.sortOrder = searchParams.get("sortOrder")!;
  if (searchParams.get("page")) filters.page = parseInt(searchParams.get("page")!, 10);
  if (searchParams.get("limit")) filters.limit = parseInt(searchParams.get("limit")!, 10);

  const parsed = searchFiltersSchema.safeParse(filters);
  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");
  }

  const result = await searchService.searchDoctors(parsed.data);
  return new Response(JSON.stringify({ data: result.data, pagination: result.pagination }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

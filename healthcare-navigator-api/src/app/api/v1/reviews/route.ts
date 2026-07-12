import { NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { success, error } from "@/lib/utils/apiResponse";
import { parsePagination } from "@/lib/utils/pagination";
import { requireUser } from "@/lib/requireUser";
import { reviewsService } from "@/lib/services/reviews.service";
import { createReviewSchema } from "@/lib/validation";

/**
 * GET /api/v1/reviews?doctorId=...&page=1&limit=20
 * Public — returns paginated reviews for a doctor.
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const url = request.nextUrl;
  const doctorId = url.searchParams.get("doctorId");

  if (!doctorId) {
    return error("doctorId query parameter is required", 400, "MISSING_PARAM");
  }

  const { page, limit } = parsePagination(Object.fromEntries(url.searchParams));
  const result = await reviewsService.getByDoctor(doctorId, page, limit);
  return success(result);
});

/**
 * POST /api/v1/reviews
 * Authenticated — create a review for a doctor.
 * Body: { doctorId, rating (1-5), comment }
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");
  }

  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  const review = await reviewsService.create(
    auth.user.id,
    auth.user.full_name,
    parsed.data.doctorId,
    parsed.data.rating,
    parsed.data.comment,
  );

  return success(review, 201);
});

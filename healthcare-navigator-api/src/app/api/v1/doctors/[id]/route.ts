import { NextRequest } from "next/server";
import { doctorsRepo } from "@/lib/repositories/doctors.repo";
import { reviewsRepo } from "@/lib/repositories/reviews.repo";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { success, error } from "@/lib/utils/apiResponse";

/** GET /api/v1/doctors/[id] — doctor detail with specialties, hospitals, ratings */
export const GET = withErrorHandler(async (request: NextRequest, ctx: any) => {
  const { id } = await ctx.params;
  const doctor = await doctorsRepo.findById(id);
  if (!doctor) return error("Doctor not found", 404, "NOT_FOUND");

  const [reviews, stats] = await Promise.all([
    reviewsRepo.findByDoctor(id, 10, 0),
    reviewsRepo.findByDoctorCount(id),
  ]);

  return success({
    ...doctor,
    average_rating: stats.average,
    review_count: stats.count,
    recent_reviews: reviews,
  });
});

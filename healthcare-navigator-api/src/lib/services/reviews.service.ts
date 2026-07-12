/**
 * Reviews service — enforces one review per user per doctor.
 */
import { reviewsRepo, type ReviewRow } from "@/lib/repositories/reviews.repo";
import { AppError } from "@/lib/middleware/errorHandler";

export const reviewsService = {
  async getByDoctor(doctorId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [reviews, stats] = await Promise.all([
      reviewsRepo.findByDoctor(doctorId, limit, offset),
      reviewsRepo.findByDoctorCount(doctorId),
    ]);
    return {
      data: reviews,
      pagination: { total: stats.count, page, limit, totalPages: Math.ceil(stats.count / limit) },
      average: stats.average,
    };
  },

  async create(userId: string, userName: string, doctorId: string, rating: number, comment: string): Promise<ReviewRow> {
    if (rating < 1 || rating > 5) throw new AppError("Rating must be between 1 and 5", 400, "INVALID_RATING");

    const existing = await reviewsRepo.findExisting(userId, doctorId);
    if (existing) throw new AppError("You have already reviewed this doctor", 409, "ALREADY_REVIEWED");

    return reviewsRepo.create({
      doctor_id: doctorId,
      user_id: userId,
      user_name: userName,
      rating,
      comment,
    });
  },

  async delete(reviewId: string, userId: string): Promise<void> {
    await reviewsRepo.delete(reviewId, userId);
  },

  async getByUser(userId: string): Promise<ReviewRow[]> {
    return reviewsRepo.findByUser(userId);
  },
};

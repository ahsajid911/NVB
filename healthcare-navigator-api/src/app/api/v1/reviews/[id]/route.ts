import { NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { success, error } from "@/lib/utils/apiResponse";
import { requireUser } from "@/lib/requireUser";
import { reviewsService } from "@/lib/services/reviews.service";
import { db } from "@/lib/db/client";

/**
 * DELETE /api/v1/reviews/:id
 * Authenticated — delete own review.
 */
export const DELETE = withErrorHandler(async (request: NextRequest, ctx: any) => {
  const { id } = await ctx.params;

  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  // Verify the review belongs to this user
  const { data: review } = await db()
    .from("reviews")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!review) return error("Review not found", 404, "NOT_FOUND");
  if (review.user_id !== auth.user.id) {
    return error("You can only delete your own reviews", 403, "FORBIDDEN");
  }

  await reviewsService.delete(id, auth.user.id);
  return success({ deleted: true });
});

import { z } from "zod";

/**
 * Shared request-body validation schemas for API routes.
 * Usage:
 *   const parsed = loginSchema.safeParse(body);
 *   if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
 *   const { username, password } = parsed.data;
 */

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(100),
  password: z.string().min(1, "Password is required").max(200),
});

export const chatSchema = z.object({
  message: z.string().trim().min(1, "message is required").max(4000),
  conversationId: z.string().max(100).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().max(4000),
      })
    )
    .max(20)
    .optional(),
});

export const symptomAnalysisSchema = z.object({
  symptoms: z.string().trim().min(1, "symptoms are required").max(2000),
  duration: z.string().max(200).optional(),
  age: z.number().int().min(0).max(130).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  notes: z.string().max(2000).optional(),
});

export const adminCreateSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email").max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: z.enum(["super_admin", "admin", "data_manager"]),
  full_name: z.string().max(200).optional(),
});

export const adminUpdateSchema = z.object({
  id: z.string().max(100).optional(),
  email: z.string().email().max(200).optional(),
  role: z.enum(["super_admin", "admin", "data_manager"]).optional(),
  is_active: z.boolean().optional(),
  full_name: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  phone: z.string().max(50).optional(),
});

export const resetPasswordSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(200),
});

export const importTypeSchema = z.enum(["doctors", "hospitals", "specialties"]);

export const userRegisterSchema = z.object({
  email: z.string().email("Invalid email").max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  full_name: z.string().max(200).optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email("Invalid email").max(200),
  password: z.string().min(1, "Password is required").max(200),
});

export const createReviewSchema = z.object({
  doctor_id: z.string().min(1, "Doctor ID is required"),
  rating: z.number().int().min(1, "Rating must be 1-5").max(5),
  comment: z.string().min(5, "Comment must be at least 5 characters").max(2000),
});

export const searchFiltersSchema = z.object({
  query: z.string().max(200).optional(),
  specialty: z.string().max(100).optional(),
  hospital: z.string().max(200).optional(),
  district: z.string().max(100).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  minExperience: z.number().int().min(0).optional(),
  maxFee: z.number().min(0).optional(),
  availableDay: z.string().max(50).optional(),
  sortBy: z.enum(["name", "experience", "fee", "rating"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

/** Sanitize a username before interpolating into a PostgREST `.or()` filter,
 *  to prevent filter-injection via `,` `.` `(` `)` and control characters. */
export function sanitizeFilterValue(value: string): string {
  return value.replace(/[\\,.()"\0\r\n]/g, "").trim().slice(0, 100);
}

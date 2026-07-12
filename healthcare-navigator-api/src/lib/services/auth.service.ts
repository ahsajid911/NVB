/**
 * Public user auth service — separate from admin auth.
 * Uses bcrypt + DB-backed sessions (same proven pattern as admin auth).
 */
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { usersRepo } from "@/lib/repositories/users.repo";
import { AppError } from "@/lib/middleware/errorHandler";
import type { UserRow } from "@/lib/repositories/users.repo";

export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export const userAuthService = {
  async register(email: string, password: string, fullName?: string): Promise<UserRow> {
    const existing = await usersRepo.findByEmail(email);
    if (existing) throw new AppError("An account with this email already exists", 409, "EMAIL_EXISTS");

    const hashed = await bcrypt.hash(password, 12);
    return usersRepo.create({ email, password_hash: hashed, full_name: fullName });
  },

  async login(email: string, password: string): Promise<{ user: UserRow; token: string }> {
    const user = await usersRepo.findByEmail(email);
    if (!user) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    await usersRepo.createSession(user.id, token, expiresAt);

    return { user, token };
  },

  async validateSession(token: string): Promise<UserRow | null> {
    return usersRepo.validateSession(token);
  },

  async logout(token: string): Promise<void> {
    await usersRepo.destroySession(token);
  },
};

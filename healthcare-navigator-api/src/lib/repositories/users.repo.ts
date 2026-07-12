/**
 * Public user repository — separate from admin auth.
 * Backed by `users` + `user_sessions` tables (see supabase/schema.sql).
 */
import { db } from "@/lib/db/client";

export interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  created_at?: string;
}

export const usersRepo = {
  async findByEmail(email: string): Promise<(UserRow & { password_hash: string }) | null> {
    const { data } = await db().from("users").select("*").eq("email", email.toLowerCase()).single();
    return data || null;
  },

  async findById(id: string): Promise<UserRow | null> {
    const { data } = await db().from("users").select("id, email, full_name, created_at").eq("id", id).single();
    return data || null;
  },

  async create(data: { email: string; password_hash: string; full_name?: string }): Promise<UserRow> {
    const id = crypto.randomUUID();
    const { data: user, error } = await db()
      .from("users")
      .insert({
        id,
        email: data.email.toLowerCase(),
        password_hash: data.password_hash,
        full_name: data.full_name || null,
      })
      .select("id, email, full_name, created_at")
      .single();
    if (error) throw error;
    return user;
  },

  async createSession(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db().from("user_sessions").insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
    });
  },

  async validateSession(token: string): Promise<UserRow | null> {
    if (!token) return null;
    const { data: session } = await db()
      .from("user_sessions")
      .select("user_id")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();
    if (!session) return null;

    const { data: user } = await db()
      .from("users")
      .select("id, email, full_name, created_at")
      .eq("id", session.user_id)
      .single();
    return user || null;
  },

  async destroySession(token: string): Promise<void> {
    await db().from("user_sessions").delete().eq("token", token);
  },
};

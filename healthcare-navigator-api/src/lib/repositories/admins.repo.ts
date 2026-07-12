/**
 * Admin repository — replaces the missing @/lib/adminApi module.
 * Handles admin CRUD, profiles, sessions, and activity logs.
 */
import { db } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth";
import { AppError } from "@/lib/middleware/errorHandler";
import { logger } from "@/lib/utils/logger";
import type { AdminRole } from "@/lib/auth";

export interface AdminRow {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdminWithProfile extends AdminRow {
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    phone: string | null;
    last_login: string | null;
    login_count: number | null;
  } | null;
}

export const adminsRepo = {
  async findAll(): Promise<AdminWithProfile[]> {
    const { data: admins, error } = await db()
      .from("admins")
      .select("id, username, email, role, is_active, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!admins) return [];

    const adminsWithProfiles = await Promise.all(
      admins.map(async (admin) => {
        const { data: profile } = await db()
          .from("admin_profiles")
          .select("full_name, avatar_url, bio, phone, last_login, login_count")
          .eq("admin_id", admin.id)
          .single();
        return { ...admin, profile: profile || null };
      })
    );

    return adminsWithProfiles;
  },

  async findById(id: string): Promise<AdminWithProfile | null> {
    const { data: admin } = await db()
      .from("admins")
      .select("id, username, email, role, is_active, created_at, updated_at")
      .eq("id", id)
      .single();
    if (!admin) return null;

    const { data: profile } = await db()
      .from("admin_profiles")
      .select("*")
      .eq("admin_id", admin.id)
      .single();

    return { ...admin, profile: profile || null };
  },

  async create(data: {
    username: string;
    email: string;
    password: string;
    role: AdminRole;
    full_name?: string;
  }): Promise<AdminRow> {
    const passwordHash = await hashPassword(data.password);

    const { data: admin, error } = await db()
      .from("admins")
      .insert({
        username: data.username,
        email: data.email,
        password_hash: passwordHash,
        role: data.role,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);

    await db().from("admin_profiles").insert({
      admin_id: admin.id,
      full_name: data.full_name || data.username,
    });

    return admin;
  },

  async update(
    id: string,
    data: {
      email?: string;
      role?: AdminRole;
      is_active?: boolean;
      full_name?: string;
      bio?: string;
      phone?: string;
    }
  ): Promise<void> {
    const updates: Record<string, any> = {};
    if (data.email) updates.email = data.email;
    if (data.role) updates.role = data.role;
    if (data.is_active !== undefined) updates.is_active = data.is_active;
    updates.updated_at = new Date().toISOString();

    const { error } = await db().from("admins").update(updates).eq("id", id);
    if (error) throw error;

    if (data.full_name || data.bio || data.phone) {
      await db()
        .from("admin_profiles")
        .upsert(
          {
            admin_id: id,
            ...(data.full_name && { full_name: data.full_name }),
            ...(data.bio && { bio: data.bio }),
            ...(data.phone && { phone: data.phone }),
          },
          { onConflict: "admin_id" }
        );
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await db().from("admins").delete().eq("id", id);
    if (error) throw error;
  },

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await hashPassword(newPassword);
    const { error } = await db()
      .from("admins")
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    // Invalidate all sessions for this admin
    await db().from("admin_sessions").delete().eq("admin_id", id);
  },

  async getActivityLogs(page = 1, limit = 50): Promise<{ logs: any[]; total: number }> {
    const offset = (page - 1) * limit;
    const { data: logs, count, error } = await db()
      .from("admin_activity_logs")
      .select("*, admins!inner(username, email)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Failed to fetch activity logs", { error: error.message });
      return { logs: [], total: 0 };
    }
    return { logs: logs || [], total: count || 0 };
  },

  async logActivity(adminId: string, action: string, resource?: string, resourceId?: string, details?: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void> {
    await db().from("admin_activity_logs").insert({
      admin_id: adminId,
      action,
      resource: resource || null,
      resource_id: resourceId || null,
      details: details || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    });
  },
};

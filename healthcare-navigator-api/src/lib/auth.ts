import { SupabaseClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getDb } from "@/lib/db/client";

/** Shared admin Supabase client (uses the singleton from lib/db/client). */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getDb();
    if (!client) throw new Error("Database not configured");
    const val = (client as any)[prop];
    return typeof val === "function" ? val.bind(client) : val;
  },
});

export type AdminRole = "super_admin" | "admin" | "data_manager";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  profile?: {
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    phone: string | null;
  };
}

export interface Permission {
  permission: string;
  resource: string;
}

const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ["create", "read", "update", "delete", "manage_roles", "manage", "import", "export"],
  admin: ["create", "read", "update", "delete", "import", "export"],
  data_manager: ["read", "update", "import", "export"],
};

/** Resources that only super_admin can modify (user/role management). */
const SUPER_ADMIN_RESOURCES = new Set(["admins", "audit_logs"]);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(adminId: string, ipAddress?: string, userAgent?: string): Promise<string> {
  const sb = getDb();
  if (!sb) throw new Error("Database unavailable — cannot create session");

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await sb.from("admin_sessions").insert({
    admin_id: adminId,
    token,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    expires_at: expiresAt.toISOString(),
  });

  await sb.from("admin_profiles").upsert({
    admin_id: adminId,
    last_login: new Date().toISOString(),
  }, { onConflict: "admin_id" });

  return token;
}

export async function validateSession(token: string): Promise<AdminUser | null> {
  if (!token) return null;

  const sb = getDb();
  if (!sb) return null;

  const { data: session } = await sb
    .from("admin_sessions")
    .select("*")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!session) return null;

  const { data: admin } = await sb
    .from("admins")
    .select("*")
    .eq("id", session.admin_id)
    .eq("is_active", true)
    .single();

  if (!admin) return null;

  const { data: profile } = await sb
    .from("admin_profiles")
    .select("full_name, avatar_url, bio, phone")
    .eq("admin_id", admin.id)
    .single();

  return {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    is_active: admin.is_active,
    profile: profile || undefined,
  };
}

export async function destroySession(token: string): Promise<void> {
  const sb = getDb();
  if (!sb) return;
  await sb.from("admin_sessions").delete().eq("token", token);
}

/**
 * Clean up expired sessions from both admin_sessions and user_sessions tables.
 * Call periodically (e.g., on health check or via a cron job) to prevent unbounded growth.
 * Returns the number of deleted sessions.
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const sb = getDb();
  if (!sb) return 0;

  const now = new Date().toISOString();
  let totalDeleted = 0;

  // Clean admin sessions
  const { count: adminDeleted } = await sb
    .from("admin_sessions")
    .delete({ count: "exact" })
    .lt("expires_at", now);
  totalDeleted += adminDeleted || 0;

  // Clean user sessions (if table exists)
  try {
    const { count: userDeleted } = await sb
      .from("user_sessions")
      .delete({ count: "exact" })
      .lt("expires_at", now);
    totalDeleted += userDeleted || 0;
  } catch {
    // user_sessions table may not exist — ignore
  }

  return totalDeleted;
}

export async function logActivity(
  adminId: string,
  action: string,
  resource?: string,
  resourceId?: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const sb = getDb();
  if (!sb) return;
  await sb.from("admin_activity_logs").insert({
    admin_id: adminId,
    action,
    resource: resource || null,
    resource_id: resourceId || null,
    details: details || null,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
  });
}

export function hasPermission(role: AdminRole, permission: string, resource: string): boolean {
  if (role === "super_admin") return true;

  // Certain resources are restricted to super_admin only
  if (SUPER_ADMIN_RESOURCES.has(resource)) return false;

  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}

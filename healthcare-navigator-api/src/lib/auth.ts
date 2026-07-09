import { createClient, SupabaseClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

let _supabaseAdmin: SupabaseClient | null = null;
function getSupabase() {
  if (_supabaseAdmin) return _supabaseAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _supabaseAdmin = createClient(url, key);
  return _supabaseAdmin;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabase();
    if (!client) throw new Error("Supabase not configured");
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
  const sb = getSupabase();
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

  const sb = getSupabase();
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
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("admin_sessions").delete().eq("token", token);
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
  const sb = getSupabase();
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
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}

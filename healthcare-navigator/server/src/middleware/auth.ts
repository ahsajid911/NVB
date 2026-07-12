import { Request, Response, NextFunction } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase not configured");
  _supabaseAdmin = createClient(url, key);
  return _supabaseAdmin;
}

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    username: string;
    email: string;
    role: string;
    is_active: boolean;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.admin_token;
    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const sb = getSupabaseAdmin();

    const { data: session, error: sessionError } = await sb
      .from("admin_sessions")
      .select("*")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single() as { data: { admin_id: string } | null; error: any };

    if (sessionError || !session) {
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }

    const { data: admin, error: adminError } = await sb
      .from("admins")
      .select("id, username, email, role, is_active")
      .eq("id", session.admin_id)
      .eq("is_active", true)
      .single() as { data: { id: string; username: string; email: string; role: string; is_active: boolean } | null; error: any };

    if (adminError || !admin) {
      res.status(401).json({ error: "Admin account not found or disabled" });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
}

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (req.admin.role === "super_admin") {
      next();
      return;
    }

    const rolePermissions: Record<string, string[]> = {
      super_admin: ["create", "read", "update", "delete", "manage_roles", "manage", "import", "export"],
      admin: ["create", "read", "update", "delete", "import", "export"],
      data_manager: ["read", "update", "import", "export"],
    };

    const perms = rolePermissions[req.admin.role] || [];
    if (!perms.includes(permission)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}

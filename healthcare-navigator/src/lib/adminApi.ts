import { supabaseAdmin, hashPassword, generateToken, logActivity, type AdminRole } from "./auth";

export async function createAdmin(data: {
  username: string;
  email: string;
  password: string;
  role: AdminRole;
  full_name?: string;
}, createdBy?: string) {
  const passwordHash = await hashPassword(data.password);

  const { data: admin, error } = await supabaseAdmin
    .from("admins")
    .insert({
      username: data.username,
      email: data.email,
      password_hash: passwordHash,
      role: data.role,
    })
    .select()
    .single();

  if (error) throw error;

  // Create profile
  await supabaseAdmin.from("admin_profiles").insert({
    admin_id: admin.id,
    full_name: data.full_name || data.username,
  });

  if (createdBy) {
    await logActivity(createdBy, "admin_created", "admins", admin.id, { username: data.username, role: data.role });
  }

  return admin;
}

export async function updateAdmin(id: string, data: {
  email?: string;
  role?: AdminRole;
  is_active?: boolean;
  full_name?: string;
  bio?: string;
  phone?: string;
}, updatedBy?: string) {
  const updates: any = {};
  if (data.email) updates.email = data.email;
  if (data.role) updates.role = data.role;
  if (data.is_active !== undefined) updates.is_active = data.is_active;
  updates.updated_at = new Date().toISOString();

  const { error } = await supabaseAdmin.from("admins").update(updates).eq("id", id);
  if (error) throw error;

  if (data.full_name || data.bio || data.phone) {
    await supabaseAdmin.from("admin_profiles").upsert({
      admin_id: id,
      ...(data.full_name && { full_name: data.full_name }),
      ...(data.bio && { bio: data.bio }),
      ...(data.phone && { phone: data.phone }),
    }, { onConflict: "admin_id" });
  }

  if (updatedBy) {
    await logActivity(updatedBy, "admin_updated", "admins", id, data);
  }
}

export async function deleteAdmin(id: string, deletedBy?: string) {
  const { error } = await supabaseAdmin.from("admins").delete().eq("id", id);
  if (error) throw error;
  if (deletedBy) {
    await logActivity(deletedBy, "admin_deleted", "admins", id);
  }
}

export async function resetAdminPassword(id: string, newPassword: string, resetBy?: string) {
  const passwordHash = await hashPassword(newPassword);
  const { error } = await supabaseAdmin.from("admins").update({ password_hash: passwordHash, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  // Invalidate all sessions
  await supabaseAdmin.from("admin_sessions").delete().eq("admin_id", id);
  if (resetBy) {
    await logActivity(resetBy, "password_reset", "admins", id);
  }
}

export async function getAllAdmins() {
  const { data: admins } = await supabaseAdmin
    .from("admins")
    .select("id, username, email, role, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (!admins) return [];

  const adminsWithProfiles = await Promise.all(
    admins.map(async (admin) => {
      const { data: profile } = await supabaseAdmin
        .from("admin_profiles")
        .select("full_name, avatar_url, bio, phone, last_login, login_count")
        .eq("admin_id", admin.id)
        .single();
      return { ...admin, profile: profile || null };
    })
  );

  return adminsWithProfiles;
}

export async function getAdminById(id: string) {
  const { data: admin } = await supabaseAdmin
    .from("admins")
    .select("id, username, email, role, is_active, created_at, updated_at")
    .eq("id", id)
    .single();

  if (!admin) return null;

  const { data: profile } = await supabaseAdmin
    .from("admin_profiles")
    .select("*")
    .eq("admin_id", admin.id)
    .single();

  return { ...admin, profile: profile || null };
}

export async function getActivityLogs(page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  const { data: logs, count } = await supabaseAdmin
    .from("admin_activity_logs")
    .select("*, admins!inner(username, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { logs: logs || [], total: count || 0 };
}

export async function getImportHistory(adminId?: string) {
  let query = supabaseAdmin.from("admin_import_history").select("*").order("created_at", { ascending: false });
  if (adminId) query = query.eq("admin_id", adminId);
  const { data } = await query.limit(100);
  return data || [];
}

export async function logImport(adminId: string, data: {
  import_type: string;
  filename?: string;
  total_rows: number;
  imported_rows: number;
  skipped_rows: number;
  errors?: any;
  status?: string;
}) {
  const { error } = await supabaseAdmin.from("admin_import_history").insert({
    admin_id: adminId,
    ...data,
  });
  if (error) throw error;
}

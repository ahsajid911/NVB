import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { supabaseAdmin, logActivity } from "@/lib/auth";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { success } from "@/lib/utils/apiResponse";
import { enforceRateLimit } from "@/lib/rateLimit";

/**
 * GET /api/v1/admin/profile — get admin profile + profile data
 * PUT /api/v1/admin/profile — update admin profile
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let profile = null;
  try {
    const result = await supabaseAdmin
      .from("admin_profiles")
      .select("*")
      .eq("admin_id", auth.user.id)
      .single();
    profile = result.data;
  } catch {}

  return success({ user: auth.user, profile });
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const limited = await enforceRateLimit(request, "admin-profile", { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const { full_name, bio, phone, avatar_url } = await request.json();

  await supabaseAdmin.from("admin_profiles").upsert(
    { admin_id: auth.user.id, full_name, bio, phone, avatar_url },
    { onConflict: "admin_id" }
  );

  await logActivity(auth.user.id, "profile_updated", "profile", auth.user.id);
  return success({ updated: true });
});

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/auth";
import { requireAdminPermission } from "@/lib/requireAdmin";

export async function GET(request: NextRequest) {
  const auth = await requireAdminPermission(request, "read", "data");
  if (!auth.ok) return auth.response;

  try {
    const [doctorsRes, hospitalsRes, specialtiesRes, districtsRes] = await Promise.all([
      supabaseAdmin.from("doctors").select("id"),
      supabaseAdmin.from("hospitals").select("id"),
      supabaseAdmin.from("specialties").select("id"),
      supabaseAdmin.from("districts").select("id"),
    ]);

    return NextResponse.json({
      doctors: doctorsRes.data?.length || 0,
      hospitals: hospitalsRes.data?.length || 0,
      specialties: specialtiesRes.data?.length || 0,
      districts: districtsRes.data?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

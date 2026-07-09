import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/auth";
import { requireAdminPermission } from "@/lib/requireAdmin";
import { importTypeSchema } from "@/lib/validation";

/**
 * CRUD for doctors / hospitals / specialties.
 * Every method requires an authenticated admin with the appropriate permission.
 */

export async function GET(request: NextRequest) {
  const auth = await requireAdminPermission(request, "read", "data");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "doctors";

  try {
    if (type === "doctors") {
      const { data, error } = await supabaseAdmin
        .from("doctors")
        .select("*, doctor_specialties(specialty_id), doctor_hospitals(hospital_id)")
        .order("name");
      if (error) throw error;

      const { data: specs } = await supabaseAdmin.from("specialties").select("id, name, name_bn, slug");
      const { data: hosps } = await supabaseAdmin.from("hospitals").select("id, name, name_bn");

      const specMap = new Map((specs || []).map((s: any) => [s.id, s]));
      const hospMap = new Map((hosps || []).map((h: any) => [h.id, h]));

      const enriched = (data || []).map((doc: any) => ({
        ...doc,
        specialties: (doc.doctor_specialties || []).map((ds: any) => specMap.get(ds.specialty_id)).filter(Boolean),
        hospitals: (doc.doctor_hospitals || []).map((dh: any) => hospMap.get(dh.hospital_id)).filter(Boolean),
      }));

      return NextResponse.json({ data: enriched });
    }

    if (type === "hospitals") {
      const { data, error } = await supabaseAdmin
        .from("hospitals")
        .select("*, districts(name, name_bn, division)")
        .order("name");
      if (error) throw error;
      return NextResponse.json({ data: data || [] });
    }

    if (type === "specialties") {
      const { data, error } = await supabaseAdmin.from("specialties").select("*").order("name");
      if (error) throw error;
      return NextResponse.json({ data: data || [] });
    }

    if (type === "districts") {
      const { data, error } = await supabaseAdmin.from("districts").select("*").order("name");
      if (error) throw error;
      return NextResponse.json({ data: data || [] });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminPermission(request, "create", "data");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { type, item, items } = body;
    const typeCheck = importTypeSchema.safeParse(type);
    if (!typeCheck.success) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    if (type === "doctors") {
      if (items && Array.isArray(items)) {
        const inserted = [];
        for (const doc of items) {
          const { specialties: _s, hospitals: _h, ...rest } = doc;
          const id = crypto.randomUUID();
          const { error } = await supabaseAdmin.from("doctors").insert({ ...rest, id });
          if (error) continue;
          if (_s?.length) {
            await supabaseAdmin.from("doctor_specialties").insert(_s.map((sid: string) => ({ doctor_id: id, specialty_id: sid })));
          }
          if (_h?.length) {
            await supabaseAdmin.from("doctor_hospitals").insert(_h.map((hid: string) => ({ doctor_id: id, hospital_id: hid })));
          }
          inserted.push(id);
        }
        return NextResponse.json({ success: true, count: inserted.length });
      }

      const { specialties: _s, hospitals: _h, ...rest } = item;
      const id = crypto.randomUUID();
      const { error } = await supabaseAdmin.from("doctors").insert({ ...rest, id });
      if (error) throw error;
      if (_s?.length) {
        await supabaseAdmin.from("doctor_specialties").insert(_s.map((sid: string) => ({ doctor_id: id, specialty_id: sid })));
      }
      if (_h?.length) {
        await supabaseAdmin.from("doctor_hospitals").insert(_h.map((hid: string) => ({ doctor_id: id, hospital_id: hid })));
      }
      return NextResponse.json({ success: true, id });
    }

    if (type === "hospitals") {
      if (items && Array.isArray(items)) {
        const ids = items.map(() => crypto.randomUUID());
        const toInsert = items.map((h: any, i: number) => ({ ...h, id: ids[i] }));
        const { error } = await supabaseAdmin.from("hospitals").insert(toInsert);
        if (error) throw error;
        return NextResponse.json({ success: true, count: ids.length });
      }
      const id = crypto.randomUUID();
      const { error } = await supabaseAdmin.from("hospitals").insert({ ...item, id });
      if (error) throw error;
      return NextResponse.json({ success: true, id });
    }

    if (type === "specialties") {
      if (items && Array.isArray(items)) {
        const ids = items.map(() => crypto.randomUUID());
        const toInsert = items.map((s: any, i: number) => ({
          ...s,
          id: ids[i],
          slug: s.slug || s.name.toLowerCase().replace(/\s+/g, "-"),
        }));
        const { error } = await supabaseAdmin.from("specialties").insert(toInsert);
        if (error) throw error;
        return NextResponse.json({ success: true, count: ids.length });
      }
      const id = crypto.randomUUID();
      const slug = item.slug || item.name.toLowerCase().replace(/\s+/g, "-");
      const { error } = await supabaseAdmin.from("specialties").insert({ ...item, id, slug });
      if (error) throw error;
      return NextResponse.json({ success: true, id });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminPermission(request, "update", "data");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { type, id, ...fields } = body;
    const typeCheck = importTypeSchema.safeParse(type);
    if (!typeCheck.success) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const table = type === "doctors" ? "doctors" : type === "hospitals" ? "hospitals" : "specialties";
    const { specialties: _s, hospitals: _h, ...rest } = fields;

    const { error } = await supabaseAdmin.from(table).update(rest).eq("id", id);
    if (error) throw error;

    if (type === "doctors") {
      if (_s?.length) {
        await supabaseAdmin.from("doctor_specialties").delete().eq("doctor_id", id);
        await supabaseAdmin.from("doctor_specialties").insert(_s.map((sid: string) => ({ doctor_id: id, specialty_id: sid })));
      }
      if (_h?.length) {
        await supabaseAdmin.from("doctor_hospitals").delete().eq("doctor_id", id);
        await supabaseAdmin.from("doctor_hospitals").insert(_h.map((hid: string) => ({ doctor_id: id, hospital_id: hid })));
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminPermission(request, "delete", "data");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { type, ids } = body;
    const typeCheck = importTypeSchema.safeParse(type);
    if (!typeCheck.success) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    if (!ids?.length) return NextResponse.json({ error: "No IDs provided" }, { status: 400 });

    if (type === "doctors") {
      await supabaseAdmin.from("doctor_specialties").delete().in("doctor_id", ids);
      await supabaseAdmin.from("doctor_hospitals").delete().in("doctor_id", ids);
      const { error } = await supabaseAdmin.from("doctors").delete().in("id", ids);
      if (error) throw error;
      return NextResponse.json({ success: true, deleted: ids.length });
    }

    if (type === "hospitals") {
      await supabaseAdmin.from("doctor_hospitals").delete().in("hospital_id", ids);
      const { error } = await supabaseAdmin.from("hospitals").delete().in("id", ids);
      if (error) throw error;
      return NextResponse.json({ success: true, deleted: ids.length });
    }

    if (type === "specialties") {
      await supabaseAdmin.from("doctor_specialties").delete().in("specialty_id", ids);
      const { error } = await supabaseAdmin.from("specialties").delete().in("id", ids);
      if (error) throw error;
      return NextResponse.json({ success: true, deleted: ids.length });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

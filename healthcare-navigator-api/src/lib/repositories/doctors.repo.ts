/**
 * Doctor repository — all PostgREST queries for the doctors table.
 * Routes/services call these methods instead of touching supabaseAdmin directly.
 */
import { db } from "@/lib/db/client";
import type { Doctor, DoctorWithRelations, SearchFilters, SearchResult } from "@/types/database";

function withRelations(): string {
  return "*, doctor_specialties(specialty_id), doctor_hospitals(hospital_id)";
}

export const doctorsRepo = {
  async findAll(limit = 20, offset = 0): Promise<Doctor[]> {
    const { data, error } = await db()
      .from("doctors")
      .select("*")
      .order("name")
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return data || [];
  },

  async findById(id: string): Promise<DoctorWithRelations | null> {
    const { data, error } = await db()
      .from("doctors")
      .select(withRelations())
      .eq("id", id)
      .single();
    if (error || !data) return null;

    // Enrich with relations
    const { data: specs } = await db().from("specialties").select("id, name, name_bn, slug");
    const { data: hosps } = await db().from("hospitals").select("id, name, name_bn");
    const specMap = new Map((specs || []).map((s: any) => [s.id, s]));
    const hospMap = new Map((hosps || []).map((h: any) => [h.id, h]));

    return {
      ...data,
      specialties: (data.doctor_specialties || []).map((ds: any) => specMap.get(ds.specialty_id)).filter(Boolean),
      hospitals: (data.doctor_hospitals || []).map((dh: any) => hospMap.get(dh.hospital_id)).filter(Boolean),
    };
  },

  async findBySpecialty(specialtyId: string): Promise<Doctor[]> {
    const { data } = await db()
      .from("doctor_specialties")
      .select("doctor_id")
      .eq("specialty_id", specialtyId);
    const ids = (data || []).map((d: any) => d.doctor_id);
    if (ids.length === 0) return [];
    const { data: doctors } = await db()
      .from("doctors")
      .select("*")
      .in("id", ids)
      .order("name");
    return doctors || [];
  },

  async findByHospital(hospitalId: string): Promise<Doctor[]> {
    const { data } = await db()
      .from("doctor_hospitals")
      .select("doctor_id")
      .eq("hospital_id", hospitalId);
    const ids = (data || []).map((d: any) => d.doctor_id);
    if (ids.length === 0) return [];
    const { data: doctors } = await db()
      .from("doctors")
      .select("*")
      .in("id", ids)
      .order("name");
    return doctors || [];
  },

  async create(doctor: Partial<Doctor>, specialtyIds: string[] = [], hospitalIds: string[] = []): Promise<Doctor> {
    const id = crypto.randomUUID();
    const { data, error } = await db().from("doctors").insert({ ...doctor, id }).select().single();
    if (error) throw error;

    if (specialtyIds.length) {
      await db().from("doctor_specialties").insert(specialtyIds.map((sid) => ({ doctor_id: id, specialty_id: sid })));
    }
    if (hospitalIds.length) {
      await db().from("doctor_hospitals").insert(hospitalIds.map((hid) => ({ doctor_id: id, hospital_id: hid })));
    }
    return data;
  },

  async update(id: string, updates: Partial<Doctor>, specialtyIds?: string[], hospitalIds?: string[]): Promise<void> {
    const { error } = await db().from("doctors").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;

    if (specialtyIds) {
      await db().from("doctor_specialties").delete().eq("doctor_id", id);
      if (specialtyIds.length) {
        await db().from("doctor_specialties").insert(specialtyIds.map((sid) => ({ doctor_id: id, specialty_id: sid })));
      }
    }
    if (hospitalIds) {
      await db().from("doctor_hospitals").delete().eq("doctor_id", id);
      if (hospitalIds.length) {
        await db().from("doctor_hospitals").insert(hospitalIds.map((hid) => ({ doctor_id: id, hospital_id: hid })));
      }
    }
  },

  async deleteMany(ids: string[]): Promise<number> {
    await db().from("doctor_specialties").delete().in("doctor_id", ids);
    await db().from("doctor_hospitals").delete().in("doctor_id", ids);
    const { error } = await db().from("doctors").delete().in("id", ids);
    if (error) throw error;
    return ids.length;
  },

  async bulkCreate(doctors: Partial<Doctor>[]): Promise<number> {
    const rows = doctors.map((d) => ({ ...d, id: crypto.randomUUID() }));
    const { error } = await db().from("doctors").insert(rows);
    if (error) throw error;
    return rows.length;
  },

  async count(): Promise<number> {
    const { count } = await db().from("doctors").select("*", { count: "exact", head: true });
    return count || 0;
  },
};

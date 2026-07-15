import { db, anonDb } from "@/lib/db/client";
import type { Hospital, HospitalWithDistrict } from "@/types/database";

export const hospitalsRepo = {
  async findAll(limit = 20, offset = 0): Promise<HospitalWithDistrict[]> {
    const { data, error } = await anonDb()
      .from("hospitals")
      .select("*, districts(name, name_bn, division, division_bn)")
      .order("name")
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data || []).map((h) => ({ ...h, district: (h as any).districts })) as HospitalWithDistrict[];
  },

  async findById(id: string): Promise<HospitalWithDistrict | null> {
    const { data, error } = await anonDb()
      .from("hospitals")
      .select("*, districts(name, name_bn, division, division_bn)")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return { ...data, district: (data as any).districts } as HospitalWithDistrict;
  },

  async findByDistrict(districtId: string): Promise<Hospital[]> {
    const { data, error } = await anonDb()
      .from("hospitals")
      .select("*")
      .eq("district_id", districtId)
      .order("name");
    if (error) throw error;
    return data || [];
  },

  async create(hospital: Partial<Hospital>): Promise<Hospital> {
    const id = crypto.randomUUID();
    const { data, error } = await db().from("hospitals").insert({ ...hospital, id }).select().single();
    if (error) throw error;
    return data;
  },

  async bulkCreate(hospitals: Partial<Hospital>[]): Promise<number> {
    const rows = hospitals.map((h) => ({ ...h, id: crypto.randomUUID() }));
    const { error } = await db().from("hospitals").insert(rows);
    if (error) throw error;
    return rows.length;
  },

  async update(id: string, updates: Partial<Hospital>): Promise<void> {
    const { error } = await db().from("hospitals").update(updates).eq("id", id);
    if (error) throw error;
  },

  async deleteMany(ids: string[]): Promise<number> {
    await db().from("doctor_hospitals").delete().in("hospital_id", ids);
    const { error } = await db().from("hospitals").delete().in("id", ids);
    if (error) throw error;
    return ids.length;
  },

  async count(): Promise<number> {
    const { count } = await db().from("hospitals").select("*", { count: "exact", head: true });
    return count || 0;
  },
};

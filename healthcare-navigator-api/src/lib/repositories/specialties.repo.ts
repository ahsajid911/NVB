import { db } from "@/lib/db/client";
import type { Specialty } from "@/types/database";

export const specialtiesRepo = {
  async findAll(): Promise<Specialty[]> {
    const { data, error } = await db().from("specialties").select("*").order("name");
    if (error) throw error;
    return data || [];
  },

  async findBySlug(slug: string): Promise<Specialty | null> {
    const { data, error } = await db().from("specialties").select("*").eq("slug", slug).single();
    if (error || !data) return null;
    return data;
  },

  async findById(id: string): Promise<Specialty | null> {
    const { data } = await db().from("specialties").select("*").eq("id", id).single();
    return data || null;
  },

  async create(specialty: Partial<Specialty>): Promise<Specialty> {
    const id = crypto.randomUUID();
    const slug = specialty.slug || String(specialty.name || "").toLowerCase().replace(/\s+/g, "-");
    const { data, error } = await db().from("specialties").insert({ ...specialty, id, slug }).select().single();
    if (error) throw error;
    return data;
  },

  async bulkCreate(specialties: Partial<Specialty>[]): Promise<number> {
    const rows = specialties.map((s) => ({
      ...s,
      id: crypto.randomUUID(),
      slug: s.slug || String(s.name || "").toLowerCase().replace(/\s+/g, "-"),
    }));
    const { error } = await db().from("specialties").insert(rows);
    if (error) throw error;
    return rows.length;
  },

  async update(id: string, updates: Partial<Specialty>): Promise<void> {
    const { error } = await db().from("specialties").update(updates).eq("id", id);
    if (error) throw error;
  },

  async deleteMany(ids: string[]): Promise<number> {
    await db().from("doctor_specialties").delete().in("specialty_id", ids);
    const { error } = await db().from("specialties").delete().in("id", ids);
    if (error) throw error;
    return ids.length;
  },

  async count(): Promise<number> {
    const { count } = await db().from("specialties").select("*", { count: "exact", head: true });
    return count || 0;
  },
};

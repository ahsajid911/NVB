/**
 * Search service — executes rich filtering against the LIVE DATABASE
 * (not in-memory arrays). Bilingual matching via PostgREST or/ilike.
 */
import { db } from "@/lib/db/client";
import type { SearchFilters, DoctorWithRelations } from "@/types/database";

export interface SearchResponse {
  data: DoctorWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const searchService = {
  async searchDoctors(filters: SearchFilters): Promise<SearchResponse> {
    let query = db().from("doctors").select(
      "*, doctor_specialties(specialty_id), doctor_hospitals(hospital_id)",
      { count: "exact" }
    );

    // Text search — bilingual (name + name_bn)
    if (filters.query) {
      query = query.or(
        `name.ilike.%${filters.query}%,name_bn.ilike.%${filters.query}%,qualifications.ilike.%${filters.query}%`
      );
    }

    if (filters.gender) {
      query = query.eq("gender", filters.gender);
    }

    if (filters.minExperience !== undefined) {
      query = query.gte("experience_years", filters.minExperience);
    }

    if (filters.maxFee !== undefined) {
      query = query.lte("consultation_fee", filters.maxFee);
    }

    // Sort
    const sortBy = filters.sortBy || "name";
    const sortOrder = filters.sortOrder || "asc";
    const ascending = sortOrder === "asc";
    if (sortBy === "name") query = query.order("name", { ascending });
    else if (sortBy === "experience") query = query.order("experience_years", { ascending: !ascending });
    else if (sortBy === "fee") query = query.order("consultation_fee", { ascending });

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    // Fetch related data once (not per doctor)
    const [specsResult, hospsResult, distsResult] = await Promise.all([
      db().from("specialties").select("id, name, name_bn, slug"),
      db().from("hospitals").select("id, name, name_bn, district_id"),
      db().from("districts").select("id, name, name_bn, division, division_bn"),
    ]);

    const specMap = new Map((specsResult.data || []).map((s: any) => [s.id, s]));
    const hospMap = new Map((hospsResult.data || []).map((h: any) => [h.id, h]));
    const distMap = new Map((distsResult.data || []).map((d: any) => [d.id, d]));

    // Enrich with relations
    const enriched = (data || []).map((doc: any) => {
      const specialties = (doc.doctor_specialties || [])
        .map((ds: any) => specMap.get(ds.specialty_id))
        .filter(Boolean);

      const hospitals = (doc.doctor_hospitals || [])
        .map((dh: any) => {
          const h = hospMap.get(dh.hospital_id);
          if (!h) return null;
          return { ...h, district: distMap.get((h as any).district_id) };
        })
        .filter(Boolean);

      return {
        ...doc,
        specialties,
        hospitals,
        average_rating: 0,
        review_count: 0,
      } as DoctorWithRelations;
    });

    // Post-filter by specialty/hospital/district (requires join data)
    let results = enriched;
    if (filters.specialty) {
      const s = filters.specialty.toLowerCase();
      results = results.filter((d) =>
        d.specialties.some((sp) => sp.slug === s || sp.name.toLowerCase().includes(s) || sp.name_bn.includes(filters.specialty!))
      );
    }
    if (filters.hospital) {
      const h = filters.hospital!.toLowerCase();
      results = results.filter((d) =>
        d.hospitals.some((hp) => hp.name.toLowerCase().includes(h) || hp.name_bn.includes(filters.hospital!))
      );
    }
    if (filters.district) {
      const dist = filters.district!.toLowerCase();
      results = results.filter((d) =>
        d.hospitals.some((hp) => (hp as any).district?.name?.toLowerCase().includes(dist))
      );
    }

    return {
      data: results,
      total: count || results.length,
      page,
      limit,
      totalPages: Math.ceil((count || results.length) / limit),
    };
  },
};

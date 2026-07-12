/**
 * Reviews repository — backed by the `reviews` table.
 * Enforces one review per user per doctor at the DB level (unique constraint).
 */
import { db } from "@/lib/db/client";

export interface ReviewRow {
  id: string;
  doctor_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at?: string;
}

export const reviewsRepo = {
  async findByDoctor(doctorId: string, limit = 20, offset = 0): Promise<ReviewRow[]> {
    const { data, error } = await db()
      .from("reviews")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return data || [];
  },

  async findByDoctorCount(doctorId: string): Promise<{ average: number; count: number }> {
    const { data, error } = await db()
      .from("reviews")
      .select("rating")
      .eq("doctor_id", doctorId);
    if (error || !data || data.length === 0) return { average: 0, count: 0 };
    const sum = data.reduce((acc: number, r: any) => acc + r.rating, 0);
    return { average: Math.round((sum / data.length) * 10) / 10, count: data.length };
  },

  async findByUser(userId: string): Promise<ReviewRow[]> {
    const { data, error } = await db()
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async findExisting(userId: string, doctorId: string): Promise<ReviewRow | null> {
    const { data } = await db()
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .eq("doctor_id", doctorId)
      .single();
    return data || null;
  },

  async create(data: {
    doctor_id: string;
    user_id: string;
    user_name: string;
    rating: number;
    comment: string;
  }): Promise<ReviewRow> {
    const id = crypto.randomUUID();
    const { data: review, error } = await db()
      .from("reviews")
      .insert({ ...data, id })
      .select()
      .single();
    if (error) throw error;
    return review;
  },

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await db().from("reviews").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
  },
};

import { db } from "@/lib/db/client";
import type { District } from "@/types/database";

export const districtsRepo = {
  async findAll(): Promise<District[]> {
    const { data, error } = await db().from("districts").select("*").order("name");
    if (error) throw error;
    return data || [];
  },

  async findById(id: string): Promise<District | null> {
    const { data } = await db().from("districts").select("*").eq("id", id).single();
    return data || null;
  },

  async count(): Promise<number> {
    const { count } = await db().from("districts").select("*", { count: "exact", head: true });
    return count || 0;
  },
};

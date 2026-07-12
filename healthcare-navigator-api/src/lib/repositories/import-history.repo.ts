/**
 * Import history repository — backed by admin_import_history.
 * Previously referenced but never persisted.
 */
import { db } from "@/lib/db/client";

export interface ImportHistoryRow {
  id: string;
  admin_id: string;
  import_type: string;
  filename: string | null;
  total_rows: number;
  imported_rows: number;
  skipped_rows: number;
  errors: any;
  status: string;
  created_at?: string;
}

export const importHistoryRepo = {
  async create(data: {
    admin_id: string;
    import_type: string;
    filename?: string;
    total_rows: number;
    imported_rows: number;
    skipped_rows: number;
    errors?: string[];
    status?: string;
  }): Promise<void> {
    await db().from("admin_import_history").insert({
      admin_id: data.admin_id,
      import_type: data.import_type,
      filename: data.filename || null,
      total_rows: data.total_rows,
      imported_rows: data.imported_rows,
      skipped_rows: data.skipped_rows,
      errors: data.errors || null,
      status: data.status || "completed",
    });
  },

  async findByAdmin(adminId: string, limit = 20): Promise<ImportHistoryRow[]> {
    const { data, error } = await db()
      .from("admin_import_history")
      .select("*")
      .eq("admin_id", adminId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return data || [];
  },

  async findAll(limit = 50): Promise<ImportHistoryRow[]> {
    const { data, error } = await db()
      .from("admin_import_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return data || [];
  },
};

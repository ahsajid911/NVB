import { NextRequest } from "next/server";
import { requireAdminPermission } from "@/lib/requireAdmin";
import { db } from "@/lib/db/client";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { success, error } from "@/lib/utils/apiResponse";

/**
 * GET /api/v1/export?type=doctors|hospitals|specialties
 * Export data from the LIVE DATABASE as CSV.
 * Requires admin with read permission on data.
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const auth = await requireAdminPermission(request, "read", "data");
  if (!auth.ok) return auth.response;

  const type = request.nextUrl.searchParams.get("type") || "doctors";

  const validTypes = ["doctors", "hospitals", "specialties"];
  if (!validTypes.includes(type)) {
    return error("Invalid type. Must be: doctors, hospitals, or specialties", 400, "INVALID_TYPE");
  }

  const client = db();
  let data: any[] = [];

  if (type === "doctors") {
    const { data: rows } = await client.from("doctors").select("*").order("name");
    data = rows || [];
  } else if (type === "hospitals") {
    const { data: rows } = await client.from("hospitals").select("*").order("name");
    data = rows || [];
  } else if (type === "specialties") {
    const { data: rows } = await client.from("specialties").select("*").order("name");
    data = rows || [];
  }

  if (data.length === 0) {
    return error("No data found", 404, "NOT_FOUND");
  }

  // Flatten array fields for CSV
  const flat = data.map((row) => {
    const out: Record<string, any> = { ...row };
    for (const key of Object.keys(out)) {
      if (Array.isArray(out[key])) out[key] = out[key].join("; ");
    }
    return out;
  });

  const headers = Object.keys(flat[0]);
  const csvContent = [
    headers.join(","),
    ...flat.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (typeof val === "string" && (val.includes(",") || val.includes('"')))
          return `"${val.replace(/"/g, '""')}"`;
        return val ?? "";
      }).join(",")
    ),
  ].join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${type}_export.csv"`,
    },
  });
});

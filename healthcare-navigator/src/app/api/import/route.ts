import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/auth";
import { requireAdminPermission } from "@/lib/requireAdmin";
import { logImport } from "@/lib/adminApi";
import { importTypeSchema } from "@/lib/validation";

/**
 * CSV import for doctors / hospitals / specialties.
 * Requires an authenticated admin with import permission.
 * Persists rows to Supabase and records an entry in admin_import_history.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminPermission(request, "import", "data");
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file || !type) {
      return NextResponse.json({ error: "File and type required" }, { status: 400 });
    }

    const typeCheck = importTypeSchema.safeParse(type);
    if (!typeCheck.success) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      return NextResponse.json({ error: "File has no data rows" }, { status: 400 });
    }
    const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1);

    const expectedHeaders: Record<string, string[]> = {
      doctors: ["name", "qualifications", "experience_years", "consultation_fee", "gender", "chamber_address", "available_days", "hospitals", "specialties"],
      hospitals: ["name", "district", "type", "address", "contact_phone", "departments", "latitude", "longitude"],
      specialties: ["name", "description"],
    };

    const required = expectedHeaders[type] || [];
    for (const h of required) {
      if (!headers.includes(h)) {
        return NextResponse.json(
          { error: `Missing required header: ${h}. Expected: ${required.join(", ")}` },
          { status: 400 }
        );
      }
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const records: Record<string, any>[] = [];

    rows.forEach((row, i) => {
      try {
        const values = parseCsvLine(row).map((v) => v.trim());
        if (values.length < 2) {
          skipped++;
          errors.push(`Row ${i + 2}: insufficient columns`);
          return;
        }
        const record: Record<string, any> = {};
        headers.forEach((h, idx) => {
          record[h] = values[idx] ?? "";
        });

        if (type === "hospitals") {
          const lat = parseFloat(record.latitude);
          const lng = parseFloat(record.longitude);
          if (record.latitude && (isNaN(lat) || lat < -90 || lat > 90)) {
            errors.push(`Row ${i + 2}: invalid latitude "${record.latitude}"`);
            skipped++;
            return;
          }
          if (record.longitude && (isNaN(lng) || lng < -180 || lng > 180)) {
            errors.push(`Row ${i + 2}: invalid longitude "${record.longitude}"`);
            skipped++;
            return;
          }
        }

        records.push(record);
      } catch {
        skipped++;
        errors.push(`Row ${i + 2}: parsing error`);
      }
    });

    // Persist to the database. Map CSV columns to the table shape and insert.
    let dbImported = 0;
    if (records.length > 0) {
      try {
        if (type === "specialties") {
          const payload = records.map((r) => ({
            id: crypto.randomUUID(),
            name: r.name,
            slug: r.slug || String(r.name).toLowerCase().replace(/\s+/g, "-"),
            description: r.description || null,
          }));
          const { error } = await supabaseAdmin.from("specialties").insert(payload);
          if (error) errors.push(`DB: ${error.message}`);
          else dbImported = payload.length;
        } else if (type === "hospitals") {
          const payload = records.map((r) => ({
            id: crypto.randomUUID(),
            name: r.name,
            district_id: r.district || null,
            type: r.type || "private",
            address: r.address || null,
            contact_phone: r.contact_phone || null,
            latitude: r.latitude ? parseFloat(r.latitude) : null,
            longitude: r.longitude ? parseFloat(r.longitude) : null,
          }));
          const { error } = await supabaseAdmin.from("hospitals").insert(payload);
          if (error) errors.push(`DB: ${error.message}`);
          else dbImported = payload.length;
        } else if (type === "doctors") {
          const payload = records.map((r) => ({
            id: crypto.randomUUID(),
            name: r.name,
            qualifications: r.qualifications || null,
            experience_years: r.experience_years ? parseInt(r.experience_years, 10) : null,
            consultation_fee: r.consultation_fee ? parseFloat(r.consultation_fee) : null,
            gender: r.gender || null,
            chamber_address: r.chamber_address || null,
          }));
          const { error } = await supabaseAdmin.from("doctors").insert(payload);
          if (error) errors.push(`DB: ${error.message}`);
          else dbImported = payload.length;
        }
      } catch (dbErr: any) {
        errors.push(`DB error: ${dbErr.message}`);
      }
    }

    imported = dbImported;

    // Record in import history.
    try {
      await logImport(auth.user.id, {
        import_type: type,
        filename: file.name,
        total_rows: rows.length,
        imported_rows: imported,
        skipped_rows: skipped,
        errors: errors.slice(0, 20),
        status: imported > 0 ? "success" : "failed",
      });
    } catch {
      // Logging is best-effort; don't fail the request over it.
    }

    return NextResponse.json({
      success: true,
      type,
      filename: file.name,
      totalRows: rows.length,
      imported,
      skipped,
      errors: errors.slice(0, 20),
      headers,
    });
  } catch {
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}

/** Minimal CSV line parser supporting quoted fields and embedded commas. */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { result.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  result.push(cur);
  return result;
}

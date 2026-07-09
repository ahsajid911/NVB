import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/auth";
import { requireAdmin } from "@/lib/requireAdmin";

const SQL = `
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
`;

export async function POST(request: NextRequest) {
  // Migration is a privileged operation — require an authenticated admin.
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const sb = supabaseAdmin;

  const results: string[] = [];

  try {
    // Step 1: Grant permissions
    let grantErr: any = null;
    try {
      const res = await sb.rpc("exec_sql", { sql: SQL }).single();
      grantErr = res.error;
    } catch {
      grantErr = { message: "rpc not available" };
    }
    results.push(grantErr ? `Grant via RPC: ${grantErr.message}` : "Grant: OK");

    // Step 2: Try direct SQL via Supabase REST
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Use the Supabase SQL endpoint directly
    const sqlUrl = `${url}/rest/v1/rpc/exec_sql`;
    const sqlResp = await fetch(sqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({ sql: SQL }),
    });

    if (sqlResp.ok) {
      results.push("Direct SQL: OK");
    } else {
      const errText = await sqlResp.text();
      results.push(`Direct SQL: ${errText.slice(0, 200)}`);

      // Fallback: try individual queries via Supabase client
      try {
        // Check if tables exist by querying them
        const tables = ["districts", "specialties", "hospitals", "doctors", "doctor_specialties", "doctor_hospitals"];
        for (const table of tables) {
          const { error } = await sb.from(table).select("*").limit(0);
          results.push(`${table}: ${error ? error.message : "accessible"}`);
        }
      } catch (e: any) {
        results.push(`Table check: ${e.message}`);
      }
    }

    // Step 3: Try a test insert to check permissions
    const { error: testErr } = await sb.from("districts").upsert({
      id: "99",
      name: "Test District",
      name_bn: "টেস্ট জেলা",
      division: "Test",
      division_bn: "টেস্ট",
    }, { onConflict: "id" });

    if (testErr) {
      results.push(`Test insert: ${testErr.message}`);
    } else {
      results.push("Test insert: OK - permissions working");
      // Clean up test
      await sb.from("districts").delete().eq("id", "99");
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results }, { status: 500 });
  }
}

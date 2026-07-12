import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { success } from "@/lib/utils/apiResponse";
import { VERSION } from "@/lib/config/env";

const startTime = Date.now();

export async function GET() {
  try {
    // Check DB connectivity
    const { error } = await db().from("districts").select("id").limit(1);
    const dbOk = !error;

    return success({
      status: dbOk ? "ok" : "degraded",
      version: VERSION,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      db: dbOk ? "connected" : "error",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return success({
      status: "degraded",
      version: VERSION,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      db: "error",
      timestamp: new Date().toISOString(),
    }, 503);
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { success } from "@/lib/utils/apiResponse";
import { VERSION } from "@/lib/config/env";
import { cleanupExpiredSessions } from "@/lib/auth";

const startTime = Date.now();
let lastCleanup = 0;
const CLEANUP_INTERVAL = 60 * 60 * 1000; // Run cleanup every hour

export async function GET() {
  try {
    // Check DB connectivity
    const { error } = await db().from("districts").select("id").limit(1);
    const dbOk = !error;

    // Periodically clean up expired sessions (every hour)
    let sessionsCleaned = 0;
    if (dbOk && Date.now() - lastCleanup > CLEANUP_INTERVAL) {
      lastCleanup = Date.now();
      sessionsCleaned = await cleanupExpiredSessions();
    }

    return success({
      status: dbOk ? "ok" : "degraded",
      version: VERSION,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      db: dbOk ? "connected" : "error",
      sessionsCleaned,
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

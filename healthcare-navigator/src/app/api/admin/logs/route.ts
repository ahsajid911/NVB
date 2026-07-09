import { NextRequest, NextResponse } from "next/server";
import { validateSession, hasPermission } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "read", "audit_logs")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { getActivityLogs } = await import("@/lib/adminApi");
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const result = await getActivityLogs(page);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ logs: [], total: 0, page: 1, pages: 0 });
  }
}

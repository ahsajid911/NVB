import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const token = request.cookies.get("admin_token")?.value;
  if (token) {
    await destroySession(token);
  }
  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_token");
  return response;
}

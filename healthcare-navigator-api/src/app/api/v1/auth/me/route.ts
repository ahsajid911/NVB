import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { userAuthService } from "@/lib/services/auth.service";
import { success, error } from "@/lib/utils/apiResponse";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;
  return success({ user: auth.user });
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get("user_token")?.value;
  if (token) await userAuthService.logout(token);
  const response = success({ message: "Logged out" });
  response.cookies.delete("user_token");
  return response;
}

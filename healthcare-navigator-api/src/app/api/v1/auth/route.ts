import { NextRequest, NextResponse } from "next/server";
import { userAuthService } from "@/lib/services/auth.service";
import { userRegisterSchema, userLoginSchema } from "@/lib/validation";
import { withErrorHandler, AppError } from "@/lib/middleware/errorHandler";
import { success, error } from "@/lib/utils/apiResponse";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();

  if (body.email && body.password && !body.username) {
    // User login/register path
    return handleUserAuth(request, body);
  }

  return error("Unknown auth action", 400);
});

async function handleUserAuth(request: NextRequest, body: any) {
  // Register
  if (!body.login) {
    const parsed = userRegisterSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0].message;
      // If it looks like a login attempt (short password), suggest the login endpoint
      if (body.password && body.password.length < 8) {
        return error(msg, 400, "VALIDATION_ERROR");
      }
      return error(msg, 400, "VALIDATION_ERROR");
    }
    const user = await userAuthService.register(parsed.data.email, parsed.data.password, parsed.data.full_name);
    return success({ user }, 201);
  }

  // Login
  const parsed = userLoginSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");
  }

  const { user, token } = await userAuthService.login(parsed.data.email, parsed.data.password);

  const response = success({ user });
  response.cookies.set("user_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return response;
}

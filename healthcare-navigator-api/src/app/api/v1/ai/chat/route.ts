import { NextRequest } from "next/server";
import { chat } from "@/lib/ai";
import { buildContext } from "@/lib/ai/context";
import { enforceRateLimit } from "@/lib/rateLimit";
import { chatSchema } from "@/lib/validation";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { success, error } from "@/lib/utils/apiResponse";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const limited = await enforceRateLimit(request, "ai-chat", { limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = chatSchema.safeParse(await request.json());
  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");
  }

  const { message, conversationId, history } = parsed.data;
  const context = buildContext();

  try {
    const response = await chat({ message, conversationId, history }, context);
    return success(response);
  } catch (err: any) {
    const msg = err.message || "AI request failed";
    if (msg.includes("All providers failed")) {
      return error("AI service temporarily unavailable", 503, "AI_UNAVAILABLE");
    }
    return error(msg, 502, "AI_ERROR");
  }
});

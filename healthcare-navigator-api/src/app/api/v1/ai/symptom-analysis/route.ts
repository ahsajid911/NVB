import { NextRequest } from "next/server";
import { analyzeSymptoms } from "@/lib/ai";
import { buildContext } from "@/lib/ai/context";
import { enforceRateLimit } from "@/lib/rateLimit";
import { symptomAnalysisSchema } from "@/lib/validation";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { success, error } from "@/lib/utils/apiResponse";

/**
 * POST /api/v1/ai/symptom-analysis
 * Consolidated symptom analysis — uses the real lib/ai provider pipeline
 * (replaces the old /api/symptoms raw-Gemini bypass).
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const limited = await enforceRateLimit(request, "ai-symptom", { limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = symptomAnalysisSchema.safeParse(await request.json());
  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");
  }

  const { symptoms, duration, age, gender, notes } = parsed.data;
  const context = buildContext();

  try {
    const response = await analyzeSymptoms({ symptoms, duration, age, gender, notes }, context);
    return success(response);
  } catch (err: any) {
    const msg = err.message || "Symptom analysis failed";
    if (msg.includes("All providers failed")) {
      return error("AI service temporarily unavailable", 503, "AI_UNAVAILABLE");
    }
    return error(msg, 502, "AI_ERROR");
  }
});

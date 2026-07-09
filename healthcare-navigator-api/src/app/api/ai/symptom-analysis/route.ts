import { NextRequest, NextResponse } from "next/server";
import { analyzeSymptoms } from "@/lib/ai";
import { buildContext } from "@/lib/ai/context";
import { enforceRateLimit } from "@/lib/rateLimit";
import { symptomAnalysisSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  // Rate-limit AI calls to mitigate cost abuse.
  const limited = enforceRateLimit(request, "ai-symptom", { limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const parsed = symptomAnalysisSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { symptoms, duration, age, gender, notes } = parsed.data;

    const context = buildContext();
    const response = await analyzeSymptoms({ symptoms, duration, age, gender, notes }, context);
    return NextResponse.json(response);
  } catch (err: any) {
    const msg = err.message || "Symptom analysis failed";
    if (msg.includes("All providers failed")) {
      return NextResponse.json({ error: "AI service temporarily unavailable. Add an API key in Admin > AI Settings." }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

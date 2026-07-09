import { NextResponse } from "next/server";
import { analyzeSymptoms } from "@/services/data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symptoms, lang } = body;
    const language = lang === "bn" ? "bn" : "en";

    if (!symptoms || typeof symptoms !== "string") {
      return NextResponse.json(
        { error: language === "bn" ? "অনুগ্রহ করে লক্ষণ লিখুন" : "Please provide symptoms text" },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const prompt = language === "bn"
          ? `আপনি একটি বাংলাদেশের স্বাস্থ্যসেবা প্ল্যাটফর্মের জন্য চিকিৎসা বিশেষজ্ঞ সুপারিশ সহকারী।

একজন ব্যবহারকারী তার লক্ষণ বর্ণনা করেছেন: "${symptoms}"

এই লক্ষণগুলোর ভিত্তিতে, সবচেয়ে উপযুক্ত চিকিৎসা বিশেষজ্ঞ শ্রেণী সুপারিশ করুন। আপনি অবশ্যই:
১. শুধুমাত্র বিশেষজ্ঞ শ্রেণীর নাম ফিরিয়ে দিন (যেমন, হৃদরোগ বিশেষজ্ঞ, স্নায়ুরোগ বিশেষজ্ঞ)
২. কখনই রোগ নির্ণয় করবেন না
৩. কখনই ওষুধ বা চিকিৎসা সুপারিশ করবেন না
৪. ১-৩টি সুপারিশকৃত বিশেষজ্ঞ এবং ১-২টি বিকল্প প্রদান করুন

এই সঠিক JSON ফরম্যাটে উত্তর দিন:
{
  "recommended": ["বিশেষজ্ঞ১", "বিশেষজ্ঞ২"],
  "alternative": ["বিশেষজ্ঞ৩"]
}

বৈধ বিশেষজ্ঞ শ্রেণী: হৃদরোগ বিশেষজ্ঞ, স্নায়ুরোগ বিশেষজ্ঞ, চর্মরোগ বিশেষজ্ঞ, অর্থোপেডিক সার্জন, গ্যাস্ট্রোএন্টেরোলজিস্ট, মনোরোগ বিশেষজ্ঞ, কান নাক ও গলা বিশেষজ্ঞ, স্ত্রীরোগ বিশেষজ্ঞ, শিশুরোগ বিশেষজ্ঞ, ক্যান্সার বিশেষজ্ঞ, ফুসফুস রোগ বিশেষজ্ঞ, মূত্ররোগ বিশেষজ্ঞ, চক্ষুরোগ বিশেষজ্ঞ, অন্তঃক্ষরা বিশেষজ্ঞ, জেনারেল সার্জন`
          : `You are a medical specialist recommendation assistant for a healthcare platform in Bangladesh.

A user describes their symptoms: "${symptoms}"

Based on these symptoms, suggest the most appropriate medical specialist categories. You MUST:
1. Return ONLY specialist category names (e.g., Cardiologist, Neurologist)
2. NEVER diagnose diseases
3. NEVER recommend medication or treatment
4. Provide 1-3 recommended specialists and 1-2 alternatives

Respond in this exact JSON format:
{
  "recommended": ["Specialist1", "Specialist2"],
  "alternative": ["Specialist3"]
}

Valid specialist categories: Cardiologist, Neurologist, Dermatologist, Orthopedic Surgeon, Gastroenterologist, Psychiatrist, ENT Specialist, Gynecologist, Pediatrician, Oncologist, Pulmonologist, Urologist, Ophthalmologist, Endocrinologist, General Surgeon`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 200 },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.recommended && Array.isArray(parsed.recommended)) {
                return NextResponse.json({
                  recommended: parsed.recommended,
                  recommended_bn: parsed.recommended,
                  alternative: parsed.alternative || [],
                  alternative_bn: parsed.alternative || [],
                  disclaimer: "This information is not medical advice. Please consult a licensed healthcare professional.",
                  disclaimer_bn: "এই তথ্য চিকিৎসা পরামর্শ নয়। অনুগ্রহ করে একজন লাইসেন্সপ্রাপ্ত স্বাস্থ্যসেবা পেশাদারের সাথে পরামর্শ করুন।",
                });
              }
            }
          }
        }
      } catch (geminiError) {
        console.error("Gemini API error, falling back to local:", geminiError);
      }
    }

    const localResult = analyzeSymptoms(symptoms, language);
    return NextResponse.json(localResult);
  } catch {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

import { v4 as uuidv4 } from "uuid";
import { ChatRequest, ChatResponse, SymptomRequest, SymptomResponse, SymptomAnalysis, HealthcareContext, RecommendedDoctor, RecommendedHospital, RecommendedSpecialty } from "./types";
import { executeWithFailover, getProviderStatus } from "./providerManager";
import { HEALTH_GUIDE_SYSTEM_PROMPT } from "./prompts/healthGuide";
import { SYMPTOM_ANALYSIS_SYSTEM_PROMPT } from "./prompts/symptomAnalysis";
import { MEDICINE_INFO_SYSTEM_PROMPT } from "./prompts/medicine";
import { ChatMessage } from "./types";

function normalizeSpecialty(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, "");
}

function matchDoctors(specialty: string, context?: HealthcareContext): RecommendedDoctor[] {
  if (!context?.doctors?.length) return [];
  const target = normalizeSpecialty(specialty);
  return context.doctors
    .filter((d) => {
      const docSpec = normalizeSpecialty(d.specialty);
      return docSpec.includes(target) || target.includes(docSpec) || docSpec === "generalphysician" && target === "generalphysician";
    })
    .slice(0, 3);
}

function matchHospitals(specialty: string, context?: HealthcareContext): RecommendedHospital[] {
  if (!context?.hospitals?.length) return [];
  const target = normalizeSpecialty(specialty);
  return context.hospitals
    .map((h) => {
      const matchedDepts = h.departments.filter((dept) => {
        const deptNorm = normalizeSpecialty(dept);
        return deptNorm.includes(target) || target.includes(deptNorm) || 
          (target === "cardiologist" && deptNorm === "cardiology") ||
          (target === "neurologist" && deptNorm === "neurology") ||
          (target === "dermatologist" && deptNorm === "dermatology") ||
          (target === "orthopedicsurgeon" && deptNorm === "orthopedics") ||
          (target === "gastroenterologist" && deptNorm === "gastroenterology") ||
          (target === "psychiatrist" && deptNorm === "psychiatry") ||
          (target === "entspecialist" && deptNorm === "ent") ||
          (target === "gynecologist" && deptNorm === "gynecology") ||
          (target === "pediatrician" && deptNorm === "pediatrics") ||
          (target === "oncologist" && deptNorm === "oncology") ||
          (target === "pulmonologist" && deptNorm === "pulmonology") ||
          (target === "urologist" && deptNorm === "urology") ||
          (target === "ophthalmologist" && deptNorm === "ophthalmology") ||
          (target === "endocrinologist" && deptNorm === "endocrinology") ||
          (target === "generalsurgeon" && deptNorm === "generalsurgery") ||
          (deptNorm.includes(target.slice(0, 5)) && target.length > 4);
      });
      return { ...h, matchScore: matchedDepts.length };
    })
    .filter((h) => h.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}

function matchSpecialty(specialty: string, context?: HealthcareContext): RecommendedSpecialty | null {
  if (!context?.specialties?.length) return null;
  const target = normalizeSpecialty(specialty);
  const match = context.specialties.find((s) => {
    const specNorm = normalizeSpecialty(s.name);
    return specNorm.includes(target) || target.includes(specNorm);
  });
  if (!match) return null;
  const doctorCount = context.doctors?.filter((d) => {
    const docSpec = normalizeSpecialty(d.specialty);
    const matchSpec = normalizeSpecialty(match.name);
    return docSpec.includes(matchSpec) || matchSpec.includes(docSpec);
  }).length || 0;
  return {
    name: match.name,
    description: match.description,
    slug: match.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    doctorCount,
  };
}

export async function chat(req: ChatRequest, context?: HealthcareContext): Promise<ChatResponse> {
  const conversationId = req.conversationId || uuidv4();
  const start = Date.now();

  let contextBlock = "";
  if (context) {
    if (context.hospitals?.length) {
      contextBlock += "\n\nAvailable Hospitals:\n" + context.hospitals.map((h) => `- ${h.name}: ${h.address} (${h.departments.join(", ")})`).join("\n");
    }
    if (context.doctors?.length) {
      contextBlock += "\n\nAvailable Doctors:\n" + context.doctors.map((d) => `- ${d.name}: ${d.specialty} at ${d.hospital} (Fee: ৳${d.fee})`).join("\n");
    }
    if (context.specialties?.length) {
      contextBlock += "\n\nAvailable Specialties:\n" + context.specialties.map((s) => `- ${s.name}: ${s.description}`).join("\n");
    }
  }

  const systemMessage: ChatMessage = {
    role: "system",
    content: HEALTH_GUIDE_SYSTEM_PROMPT + contextBlock,
  };

  const historyMessages: ChatMessage[] = (req.history || []).slice(-20);
  const userMessage: ChatMessage = { role: "user", content: req.message };

  const messages = [systemMessage, ...historyMessages, userMessage];

  const { result, meta } = await executeWithFailover(messages);

  return {
    response: result.content,
    conversationId,
    provider: meta.provider,
    model: meta.model,
    tokens: result.tokens,
    responseTime: Date.now() - start,
  };
}

export async function analyzeSymptoms(req: SymptomRequest, context?: HealthcareContext): Promise<SymptomResponse> {
  const start = Date.now();

  const symptomText = `Symptoms: ${req.symptoms}${req.duration ? `\nDuration: ${req.duration}` : ""}${req.age ? `\nAge: ${req.age}` : ""}${req.gender ? `\nGender: ${req.gender}` : ""}${req.notes ? `\nAdditional Notes: ${req.notes}` : ""}`;

  const messages: ChatMessage[] = [
    { role: "system", content: SYMPTOM_ANALYSIS_SYSTEM_PROMPT },
    { role: "user", content: symptomText },
  ];

  const { result, meta } = await executeWithFailover(messages);

  let analysis: SymptomAnalysis;
  try {
    const cleaned = result.content.replace(/```json\n?|\n?```/g, "").trim();
    analysis = JSON.parse(cleaned);
  } catch {
    analysis = {
      severity: "moderate",
      possibleConditions: ["Unable to determine"],
      recommendedSpecialty: "General Physician",
      selfCare: ["Rest and monitor your symptoms", "Stay hydrated"],
      warningSigns: ["Worsening symptoms", "Persistent pain"],
      recommendation: "Please consult a healthcare professional for proper evaluation.",
      emergency: false,
    };
  }

  const recommendedDoctors = matchDoctors(analysis.recommendedSpecialty, context);
  const recommendedHospitals = matchHospitals(analysis.recommendedSpecialty, context);
  const recommendedSpecialty = matchSpecialty(analysis.recommendedSpecialty, context);

  return {
    analysis,
    recommendedSpecialty,
    recommendedDoctors,
    recommendedHospitals,
    provider: meta.provider,
    model: meta.model,
    responseTime: Date.now() - start,
  };
}

export async function medicineInfo(medicineName: string): Promise<{ response: string; provider: string; model: string }> {
  const messages: ChatMessage[] = [
    { role: "system", content: MEDICINE_INFO_SYSTEM_PROMPT },
    { role: "user", content: `Tell me about ${medicineName}` },
  ];

  const { result, meta } = await executeWithFailover(messages);

  return {
    response: result.content,
    provider: meta.provider,
    model: meta.model,
  };
}

export async function translate(text: string, targetLanguage: string): Promise<{ response: string; provider: string; model: string }> {
  const messages: ChatMessage[] = [
    { role: "system", content: `Translate the following text to ${targetLanguage}. Return only the translated text, nothing else.` },
    { role: "user", content: text },
  ];

  const { result, meta } = await executeWithFailover(messages);

  return {
    response: result.content,
    provider: meta.provider,
    model: meta.model,
  };
}

export { getProviderStatus };
import { randomUUID } from "crypto";
import { ChatRequest, ChatResponse, SymptomRequest, SymptomResponse, SymptomAnalysis, HealthcareContext, RecommendedDoctor, RecommendedHospital, RecommendedSpecialty, ChatMessage } from "./types";
import { executeWithFailover } from "./providerManager";
import { HEALTH_GUIDE_SYSTEM_PROMPT } from "./prompts/healthGuide";
import { SYMPTOM_ANALYSIS_SYSTEM_PROMPT } from "./prompts/symptomAnalysis";
import { MEDICINE_INFO_SYSTEM_PROMPT } from "./prompts/medicine";

function normalizeSpecialty(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, "");
}

function matchDoctors(specialty: string, context?: HealthcareContext): RecommendedDoctor[] {
  if (!context?.doctors?.length) return [];
  const target = normalizeSpecialty(specialty);
  return context.doctors
    .filter((d) => {
      const docSpec = normalizeSpecialty(d.specialty);
      return docSpec.includes(target) || target.includes(docSpec);
    })
    .slice(0, 3);
}

function matchHospitals(specialty: string, context?: HealthcareContext): RecommendedHospital[] {
  if (!context?.hospitals?.length) return [];
  const target = normalizeSpecialty(specialty);
  const specialtyDeptMap: Record<string, string> = {
    cardiologist: "cardiology", neurologist: "neurology", dermatologist: "dermatology",
    "orthopedicsurgeon": "orthopedics", gastroenterologist: "gastroenterology",
    psychiatrist: "psychiatry", entspecialist: "ent", gynecologist: "gynecology",
    pediatrician: "pediatrics", oncologist: "oncology", pulmonologist: "pulmonology",
    urologist: "urology", ophthalmologist: "ophthalmology", endocrinologist: "endocrinology",
    generalsurgeon: "generalsurgery",
  };
  return context.hospitals
    .map((h) => {
      const matchedDepts = h.departments.filter((dept) => {
        const deptNorm = normalizeSpecialty(dept);
        const mappedTarget = specialtyDeptMap[target] || target;
        return deptNorm.includes(mappedTarget) || mappedTarget.includes(deptNorm) || (deptNorm.includes(target.slice(0, 5)) && target.length > 4);
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
    name: match.name, description: match.description,
    slug: match.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    doctorCount,
  };
}

export async function chat(req: ChatRequest, context?: HealthcareContext): Promise<ChatResponse> {
  const conversationId = req.conversationId || randomUUID();
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

  const messages: ChatMessage[] = [
    { role: "system", content: HEALTH_GUIDE_SYSTEM_PROMPT + contextBlock },
    ...(req.history || []).slice(-20),
    { role: "user", content: req.message },
  ];

  const { result, meta } = await executeWithFailover(messages);
  return { response: result.content, conversationId, provider: meta.provider, model: meta.model, tokens: result.tokens, responseTime: Date.now() - start };
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
      severity: "moderate", possibleConditions: ["Unable to determine"],
      recommendedSpecialty: "General Physician",
      selfCare: ["Rest and monitor your symptoms", "Stay hydrated"],
      warningSigns: ["Worsening symptoms", "Persistent pain"],
      recommendation: "Please consult a healthcare professional for proper evaluation.",
      emergency: false,
    };
  }

  return {
    analysis,
    recommendedSpecialty: matchSpecialty(analysis.recommendedSpecialty, context),
    recommendedDoctors: matchDoctors(analysis.recommendedSpecialty, context),
    recommendedHospitals: matchHospitals(analysis.recommendedSpecialty, context),
    provider: meta.provider, model: meta.model, responseTime: Date.now() - start,
  };
}

export async function medicineInfo(medicineName: string): Promise<{ response: string; provider: string; model: string }> {
  const messages: ChatMessage[] = [
    { role: "system", content: MEDICINE_INFO_SYSTEM_PROMPT },
    { role: "user", content: `Tell me about ${medicineName}` },
  ];
  const { result, meta } = await executeWithFailover(messages);
  return { response: result.content, provider: meta.provider, model: meta.model };
}


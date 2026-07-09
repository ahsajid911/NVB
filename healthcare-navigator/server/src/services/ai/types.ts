export type ProviderName = "nvidia" | "gemini" | "openai" | "groq" | "ollama" | "nim" | "anthropic" | "together" | "deepseek";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  history?: ChatMessage[];
  context?: HealthcareContext;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  provider: string;
  model: string;
  tokens?: { prompt: number; completion: number };
  responseTime: number;
}

export interface SymptomRequest {
  symptoms: string;
  duration?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  notes?: string;
}

export interface SymptomAnalysis {
  severity: string;
  possibleConditions: string[];
  recommendedSpecialty: string;
  selfCare: string[];
  warningSigns: string[];
  recommendation: string;
  emergency: boolean;
}

export interface RecommendedDoctor {
  name: string;
  specialty: string;
  hospital: string;
  fee: number;
}

export interface RecommendedHospital {
  name: string;
  address: string;
  departments: string[];
  matchScore: number;
}

export interface RecommendedSpecialty {
  name: string;
  description: string;
  slug: string;
  doctorCount: number;
}

export interface SymptomResponse {
  analysis: SymptomAnalysis;
  recommendedSpecialty: RecommendedSpecialty | null;
  recommendedDoctors: RecommendedDoctor[];
  recommendedHospitals: RecommendedHospital[];
  provider: string;
  model: string;
  responseTime: number;
}

export interface HealthcareContext {
  hospitals?: { name: string; address: string; departments: string[] }[];
  doctors?: { name: string; specialty: string; hospital: string; fee: number }[];
  specialties?: { name: string; description: string }[];
}

export interface ProviderResponse {
  content: string;
  tokens?: { prompt: number; completion: number };
  finishReason?: string;
}

export interface AIProvider {
  name: ProviderName;
  chat(messages: ChatMessage[], model: string, temperature: number, maxTokens: number, apiKey?: string): Promise<ProviderResponse>;
  isAvailable(): boolean;
}

export interface AIServiceLog {
  id: string;
  timestamp: string;
  provider: string;
  apiKeyId: string;
  model: string;
  endpoint: string;
  responseTime: number;
  tokens?: { prompt: number; completion: number };
  success: boolean;
  error?: string;
  failoverFrom?: string;
}

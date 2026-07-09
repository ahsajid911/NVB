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

export interface ProviderConfig {
  id: string;
  provider: string;
  enabled: boolean;
  priority: number;
  model: string;
  temperature: number;
  timeout: number;
  maxTokens: number;
}

export interface ApiKeyEntry {
  id: string;
  providerId: string;
  encryptedKey: string;
  active: boolean;
  priority: number;
  lastUsed: string | null;
  rateLimitedUntil: string | null;
}

export const VALID_MODELS: Record<string, string[]> = {
  nvidia: ["meta/llama-3.3-70b-instruct", "meta/llama-3.1-70b-instruct", "meta/llama-3.1-8b-instruct", "meta/llama-3.2-90b-vision-instruct", "deepseek-ai/deepseek-r1", "nvidia/llama-3.1-nemotron-70b-instruct"],
  gemini: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  groq: ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "llama-3.3-70b-versatile"],
  ollama: ["llama3.1", "llama3", "mistral", "codellama"],
  nim: ["meta/llama-3.1-70b-instruct", "meta/llama-3.3-70b-instruct"],
  anthropic: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-haiku-20240307"],
  together: ["meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", "mistralai/Mixtral-8x7B-Instruct-v0.1", "deepseek-ai/DeepSeek-R1", "Qwen/Qwen2.5-72B-Instruct-Turbo"],
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
};

export const VALID_KEY_PREFIXES: Record<string, string[]> = {
  nvidia: ["nvapi-"],
  gemini: ["AI"],
  openai: ["sk-"],
  groq: ["gsk_"],
  ollama: [],
  nim: ["nvapi-"],
  anthropic: ["sk-ant-"],
  together: ["tok_"],
  deepseek: ["sk-"],
};

export const DEFAULT_PROVIDERS: ProviderConfig[] = [
  { id: "nvidia-1", provider: "nvidia", enabled: true, priority: 1, model: "meta/llama-3.1-8b-instruct", temperature: 0.3, timeout: 30000, maxTokens: 2048 },
  { id: "gemini-1", provider: "gemini", enabled: true, priority: 2, model: "gemini-1.5-flash", temperature: 0.3, timeout: 30000, maxTokens: 2048 },
  { id: "openai-1", provider: "openai", enabled: false, priority: 3, model: "gpt-4o-mini", temperature: 0.3, timeout: 30000, maxTokens: 2048 },
  { id: "groq-1", provider: "groq", enabled: false, priority: 4, model: "llama-3.1-70b-versatile", temperature: 0.3, timeout: 15000, maxTokens: 2048 },
  { id: "anthropic-1", provider: "anthropic", enabled: false, priority: 5, model: "claude-3-5-haiku-20241022", temperature: 0.3, timeout: 30000, maxTokens: 2048 },
  { id: "deepseek-1", provider: "deepseek", enabled: false, priority: 6, model: "deepseek-chat", temperature: 0.3, timeout: 30000, maxTokens: 2048 },
  { id: "together-1", provider: "together", enabled: false, priority: 7, model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", temperature: 0.3, timeout: 30000, maxTokens: 2048 },
  { id: "ollama-1", provider: "ollama", enabled: false, priority: 8, model: "llama3.1", temperature: 0.3, timeout: 60000, maxTokens: 2048 },
  { id: "nim-1", provider: "nim", enabled: false, priority: 9, model: "meta/llama-3.1-70b-instruct", temperature: 0.3, timeout: 30000, maxTokens: 2048 },
];

export function validateModelName(provider: string, model: string): boolean {
  const valid = VALID_MODELS[provider];
  if (!valid) return true;
  return valid.includes(model);
}

export function validateApiKeyFormat(provider: string, key: string): boolean {
  const prefixes = VALID_KEY_PREFIXES[provider];
  if (!prefixes || prefixes.length === 0) return true;
  return prefixes.some(p => key.startsWith(p));
}

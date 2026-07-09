import fs from "fs";
import path from "path";

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
  { id: "nvidia-1", provider: "nvidia", enabled: true, priority: 1, model: "meta/llama-3.3-70b-instruct", temperature: 0.3, timeout: 30000, maxTokens: 2048 },
  { id: "gemini-1", provider: "gemini", enabled: true, priority: 2, model: "gemini-1.5-flash", temperature: 0.3, timeout: 30000, maxTokens: 2048 },
  { id: "openai-1", provider: "openai", enabled: false, priority: 3, model: "gpt-4o-mini", temperature: 0.3, timeout: 30000, maxTokens: 2048 },
  { id: "groq-1", provider: "groq", enabled: false, priority: 4, model: "llama-3.1-70b-versatile", temperature: 0.3, timeout: 15000, maxTokens: 2048 },
  { id: "anthropic-1", provider: "anthropic", enabled: false, priority: 5, model: "claude-3-5-haiku-20241022", temperature: 0.3, timeout: 30000, maxTokens: 2048 },
  { id: "deepseek-1", provider: "deepseek", enabled: false, priority: 6, model: "deepseek-chat", temperature: 0.3, timeout: 30000, maxTokens: 2048 },
  { id: "together-1", provider: "together", enabled: false, priority: 7, model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", temperature: 0.3, timeout: 30000, maxTokens: 2048 },
  { id: "ollama-1", provider: "ollama", enabled: false, priority: 8, model: "llama3.1", temperature: 0.3, timeout: 60000, maxTokens: 2048 },
  { id: "nim-1", provider: "nim", enabled: false, priority: 9, model: "meta/llama-3.1-70b-instruct", temperature: 0.3, timeout: 30000, maxTokens: 2048 },
];

const DATA_DIR = path.join(__dirname, "../../data");
const PROVIDERS_FILE = path.join(DATA_DIR, "providers.json");
const KEYS_FILE = path.join(DATA_DIR, "api-keys.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadProviders(): ProviderConfig[] {
  try {
    ensureDataDir();
    if (fs.existsSync(PROVIDERS_FILE)) {
      const raw = fs.readFileSync(PROVIDERS_FILE, "utf-8");
      const loaded = JSON.parse(raw);
      if (Array.isArray(loaded) && loaded.length > 0) return loaded;
    }
  } catch (err) {
    console.error("[Config] Failed to load providers from file:", err);
  }
  return [...DEFAULT_PROVIDERS];
}

function saveProviders(data: ProviderConfig[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(PROVIDERS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[Config] Failed to save providers:", err);
  }
}

function loadKeys(): ApiKeyEntry[] {
  try {
    ensureDataDir();
    if (fs.existsSync(KEYS_FILE)) {
      const raw = fs.readFileSync(KEYS_FILE, "utf-8");
      const loaded = JSON.parse(raw);
      if (Array.isArray(loaded)) return loaded;
    }
  } catch (err) {
    console.error("[Config] Failed to load API keys from file:", err);
  }
  return [];
}

function saveKeys(data: ApiKeyEntry[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[Config] Failed to save API keys:", err);
  }
}

let providers: ProviderConfig[] = loadProviders();
let apiKeys: ApiKeyEntry[] = loadKeys();

console.log(`[Config] Loaded ${providers.length} providers, ${apiKeys.length} API keys from disk`);

export function getProviders(): ProviderConfig[] { return providers; }
export function setProviders(p: ProviderConfig[]) { providers = p; saveProviders(p); }
export function getApiKeys(): ApiKeyEntry[] { return apiKeys; }
export function setApiKeys(k: ApiKeyEntry[]) { apiKeys = k; saveKeys(k); }
export function addApiKey(k: ApiKeyEntry) { apiKeys.push(k); saveKeys(apiKeys); }
export function removeApiKey(id: string) { apiKeys = apiKeys.filter(k => k.id !== id); saveKeys(apiKeys); }
export function updateApiKey(id: string, updates: Partial<ApiKeyEntry>) {
  const key = apiKeys.find(k => k.id === id);
  if (key) {
    Object.assign(key, updates);
    saveKeys(apiKeys);
  }
}

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

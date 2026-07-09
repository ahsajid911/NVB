import { randomUUID } from "crypto";
import { AIProvider, ChatMessage, ProviderResponse, ProviderName, ProviderConfig, ApiKeyEntry } from "./types";
import { NvidiaProvider } from "./providers/nvidia";
import { GeminiProvider } from "./providers/gemini";
import { OpenAIProvider } from "./providers/openai";
import { GroqProvider } from "./providers/groq";
import { OllamaProvider } from "./providers/ollama";
import { NimProvider } from "./providers/nim";
import { AnthropicProvider } from "./providers/anthropic";
import { TogetherProvider } from "./providers/together";
import { DeepSeekProvider } from "./providers/deepseek";
import { getProviders, getApiKeys } from "./config";

function createProviderInstance(name: ProviderName): AIProvider {
  switch (name) {
    case "nvidia": return new NvidiaProvider();
    case "gemini": return new GeminiProvider();
    case "openai": return new OpenAIProvider();
    case "groq": return new GroqProvider();
    case "ollama": return new OllamaProvider();
    case "nim": return new NimProvider();
    case "anthropic": return new AnthropicProvider();
    case "together": return new TogetherProvider();
    case "deepseek": return new DeepSeekProvider();
    default: throw new Error(`Unknown provider: ${name}`);
  }
}

function isRateLimited(key: ApiKeyEntry): boolean {
  if (!key.rateLimitedUntil) return false;
  return new Date(key.rateLimitedUntil) > new Date();
}

function markRateLimited(key: ApiKeyEntry, minutes: number = 5) {
  const until = new Date();
  until.setMinutes(until.getMinutes() + minutes);
  key.rateLimitedUntil = until.toISOString();
}

function isRetryableError(error: string): boolean {
  const retryablePatterns = ["429", "rate limit", "timeout", "ECONNREFUSED", "unavailable", "503", "502", "econnreset"];
  return retryablePatterns.some((p) => error.toLowerCase().includes(p.toLowerCase()));
}

export interface ProviderResult {
  provider: string;
  model: string;
  apiKeyId: string;
}

export async function executeWithFailover(
  messages: ChatMessage[],
  preferredProvider?: string
): Promise<{ result: ProviderResponse; meta: ProviderResult }> {
  const providers = (await getProviders()).filter((p) => p.enabled).sort((a, b) => a.priority - b.priority);
  const allApiKeys = await getApiKeys();

  if (providers.length === 0) throw new Error("No AI providers enabled");

  let orderedProviders = providers;
  if (preferredProvider) {
    const preferred = providers.filter((p) => p.provider === preferredProvider);
    const others = providers.filter((p) => p.provider !== preferredProvider);
    orderedProviders = [...preferred, ...others];
  }

  let lastError = "";

  for (const providerConfig of orderedProviders) {
    const providerKeys = allApiKeys
      .filter((k) => k.providerId === providerConfig.id && k.active && !isRateLimited(k))
      .sort((a, b) => a.priority - b.priority);

    if (providerConfig.provider !== "ollama" && providerKeys.length === 0) continue;

    const instance = createProviderInstance(providerConfig.provider as ProviderName);

    if (providerConfig.provider === "ollama") {
      try {
        const result = await instance.chat(messages, providerConfig.model, providerConfig.temperature, providerConfig.maxTokens);
        return { result, meta: { provider: providerConfig.provider, model: providerConfig.model, apiKeyId: "ollama-local" } };
      } catch (err: any) {
        lastError = err.message || "Ollama error";
        continue;
      }
    }

    for (const key of providerKeys) {
      try {
        const result = await instance.chat(messages, providerConfig.model, providerConfig.temperature, providerConfig.maxTokens, key.encryptedKey);
        key.lastUsed = new Date().toISOString();
        return { result, meta: { provider: providerConfig.provider, model: providerConfig.model, apiKeyId: key.id } };
      } catch (err: any) {
        lastError = err.message || "Provider error";
        if (isRetryableError(lastError)) {
          if (lastError.includes("429") || lastError.toLowerCase().includes("rate limit")) markRateLimited(key);
          continue;
        }
        break;
      }
    }
  }

  throw new Error(`All providers failed. Last error: ${lastError}`);
}

export async function getProviderStatus() {
  const providers = await getProviders();
  const keys = await getApiKeys();
  return providers.map((p) => ({
    provider: p.provider,
    enabled: p.enabled,
    priority: p.priority,
    model: p.model,
    keyCount: keys.filter((k) => k.providerId === p.id).length,
    activeKeys: keys.filter((k) => k.providerId === p.id && k.active && !isRateLimited(k)).length,
  }));
}

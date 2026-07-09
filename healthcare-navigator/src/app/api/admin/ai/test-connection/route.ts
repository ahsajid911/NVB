import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getProviders, getApiKeys, addApiKey } from "@/lib/ai/config";
import { validateApiKeyFormat } from "@/lib/ai/types";
import { NvidiaProvider } from "@/lib/ai/providers/nvidia";
import { GeminiProvider } from "@/lib/ai/providers/gemini";
import { OpenAIProvider } from "@/lib/ai/providers/openai";
import { GroqProvider } from "@/lib/ai/providers/groq";
import { AnthropicProvider } from "@/lib/ai/providers/anthropic";
import { TogetherProvider } from "@/lib/ai/providers/together";
import { DeepSeekProvider } from "@/lib/ai/providers/deepseek";
import { requireAdminPermission } from "@/lib/requireAdmin";
import { encrypt, decrypt } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  const auth = await requireAdminPermission(request, "manage", "ai");
  if (!auth.ok) return auth.response;

  try {
    const { provider, model, apiKey } = await request.json();
    if (!provider || !model || !apiKey) {
      return NextResponse.json({ success: false, error: "provider, model, and apiKey are required" }, { status: 400 });
    }

    const providers = await getProviders();
    const providerConfig = providers.find((p) => p.provider === provider);
    if (!providerConfig) {
      return NextResponse.json({ success: false, error: `Unknown provider: ${provider}` }, { status: 400 });
    }

    if (!validateApiKeyFormat(provider, apiKey)) {
      return NextResponse.json({ success: false, error: `Key format looks wrong for ${provider}` }, { status: 400 });
    }

    const testMessages = [{ role: "user" as const, content: "Say 'connection successful' in exactly 3 words." }];

    const providerInstance = (() => {
      switch (provider) {
        case "nvidia": return new NvidiaProvider();
        case "gemini": return new GeminiProvider();
        case "openai": return new OpenAIProvider();
        case "groq": return new GroqProvider();
        case "anthropic": return new AnthropicProvider();
        case "together": return new TogetherProvider();
        case "deepseek": return new DeepSeekProvider();
        default: return null;
      }
    })();

    if (!providerInstance) {
      return NextResponse.json({ success: false, error: `Provider ${provider} cannot be tested` }, { status: 400 });
    }

    const startTime = Date.now();
    const result = await providerInstance.chat(testMessages, model, 0.1, 50, apiKey);
    const responseTime = Date.now() - startTime;

    // Save the key (encrypted). Compare against decrypted stored values to avoid
    // duplicate plaintext comparisons.
    const existingKeys = await getApiKeys();
    const existingForProvider = existingKeys.filter((k) => k.providerId === providerConfig.id);
    const alreadyExists = existingForProvider.some((k) => decrypt(k.encryptedKey) === apiKey);

    if (!alreadyExists) {
      await addApiKey({
        id: randomUUID(), providerId: providerConfig.id, encryptedKey: encrypt(apiKey),
        active: true, priority: existingForProvider.length + 1,
        lastUsed: null, rateLimitedUntil: null,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Connected to ${provider} successfully`,
      responseTime,
      model,
      preview: result.content.substring(0, 100),
      saved: !alreadyExists,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Connection test failed" }, { status: 500 });
  }
}

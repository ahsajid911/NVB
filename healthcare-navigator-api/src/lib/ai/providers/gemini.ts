import { AIProvider, ChatMessage, ProviderResponse } from "../types";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiProvider implements AIProvider {
  name = "gemini" as const;

  async chat(messages: ChatMessage[], model: string, temperature: number, maxTokens: number, apiKey: string): Promise<ProviderResponse> {
    if (!apiKey) throw new Error("Gemini API key is required");
    if (!messages.length) throw new Error("Messages array cannot be empty");
    if (!model) throw new Error("Model name is required");

    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages.filter((m) => m.role !== "system");

    const contents = conversationMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;
    const body: Record<string, any> = {
      contents,
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    };

    if (systemMessage) {
      body.systemInstruction = { parts: [{ text: systemMessage.content }] };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.text().catch(() => "Unknown error");
        throw new Error(`Gemini API error ${response.status}: ${(err.length > 500 ? err.substring(0, 500) + "..." : err)}`);
      }

      const data: any = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini API returned empty response");

      const usage = data.usageMetadata;
      return {
        content: text,
        tokens: usage ? { prompt: usage.promptTokenCount || 0, completion: usage.candidatesTokenCount || 0 } : undefined,
      };
    } catch (err: any) {
      if (err.name === "AbortError") throw new Error("Gemini API request timed out (30s)");
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  isAvailable(): boolean { return true; }
}

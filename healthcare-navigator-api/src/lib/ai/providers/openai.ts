import { AIProvider, ChatMessage, ProviderResponse } from "../types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export class OpenAIProvider implements AIProvider {
  name = "openai" as const;

  async chat(messages: ChatMessage[], model: string, temperature: number, maxTokens: number, apiKey: string): Promise<ProviderResponse> {
    if (!apiKey) throw new Error("OpenAI API key is required");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
        signal: controller.signal,
      });
      if (!response.ok) { const err = await response.text().catch(() => ""); throw new Error(`OpenAI API error ${response.status}: ${(err.length > 500 ? err.substring(0, 500) + "..." : err)}`); }
      const data: any = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("OpenAI API returned empty response");
      return { content, tokens: data.usage ? { prompt: data.usage.prompt_tokens || 0, completion: data.usage.completion_tokens || 0 } : undefined, finishReason: data.choices?.[0]?.finish_reason };
    } catch (err: any) { if (err.name === "AbortError") throw new Error("OpenAI API request timed out (30s)"); throw err; } finally { clearTimeout(timeout); }
  }
  isAvailable(): boolean { return true; }
}

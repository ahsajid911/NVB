import { AIProvider, ChatMessage, ProviderResponse } from "../types";

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export class NvidiaProvider implements AIProvider {
  name = "nvidia" as const;

  async chat(messages: ChatMessage[], model: string, temperature: number, maxTokens: number, apiKey: string): Promise<ProviderResponse> {
    if (!apiKey) throw new Error("NVIDIA API key is required");
    if (!messages.length) throw new Error("Messages array cannot be empty");
    if (!model) throw new Error("Model name is required");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(NVIDIA_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.text().catch(() => "Unknown error");
        const trimmed = err.length > 500 ? err.substring(0, 500) + "..." : err;
        throw new Error(`NVIDIA API error ${response.status}: ${trimmed}`);
      }

      const data: any = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("NVIDIA API returned empty response");
      }

      return {
        content,
        tokens: data.usage ? { prompt: data.usage.prompt_tokens || 0, completion: data.usage.completion_tokens || 0 } : undefined,
        finishReason: data.choices?.[0]?.finish_reason,
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error("NVIDIA API request timed out (30s)");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  isAvailable(): boolean {
    return true;
  }
}

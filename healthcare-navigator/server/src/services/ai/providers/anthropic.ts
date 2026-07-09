import { AIProvider, ChatMessage, ProviderResponse } from "../types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export class AnthropicProvider implements AIProvider {
  name = "anthropic" as const;

  async chat(messages: ChatMessage[], model: string, temperature: number, maxTokens: number, apiKey: string): Promise<ProviderResponse> {
    if (!apiKey) throw new Error("Anthropic API key is required");
    if (!messages.length) throw new Error("Messages array cannot be empty");
    if (!model) throw new Error("Model name is required");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const systemMsg = messages.find((m) => m.role === "system");
      const chatMessages = messages.filter((m) => m.role !== "system");

      const body: any = {
        model,
        messages: chatMessages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: maxTokens,
        temperature,
      };
      if (systemMsg) body.system = systemMsg.content;

      const response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.text().catch(() => "Unknown error");
        const trimmed = err.length > 500 ? err.substring(0, 500) + "..." : err;
        throw new Error(`Anthropic API error ${response.status}: ${trimmed}`);
      }

      const data: any = await response.json();
      const content = data.content?.[0]?.text;
      if (!content) throw new Error("Anthropic API returned empty response");

      return {
        content,
        tokens: data.usage ? { prompt: data.usage.input_tokens || 0, completion: data.usage.output_tokens || 0 } : undefined,
        finishReason: data.stop_reason,
      };
    } catch (err: any) {
      if (err.name === "AbortError") throw new Error("Anthropic API request timed out (30s)");
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  isAvailable(): boolean { return true; }
}

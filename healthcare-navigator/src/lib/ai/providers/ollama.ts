import { AIProvider, ChatMessage, ProviderResponse } from "../types";

const OLLAMA_API_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export class OllamaProvider implements AIProvider {
  name = "ollama" as const;

  async chat(messages: ChatMessage[], model: string, temperature: number, maxTokens: number): Promise<ProviderResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: messages.map((m) => ({ role: m.role, content: m.content })), options: { temperature, num_predict: maxTokens }, stream: false }),
        signal: controller.signal,
      });
      if (!response.ok) { const err = await response.text().catch(() => ""); throw new Error(`Ollama API error ${response.status}: ${(err.length > 500 ? err.substring(0, 500) + "..." : err)}`); }
      const data: any = await response.json();
      const content = data.message?.content;
      if (!content) throw new Error("Ollama API returned empty response");
      return { content, tokens: data.prompt_eval_count ? { prompt: data.prompt_eval_count, completion: data.eval_count || 0 } : undefined };
    } catch (err: any) { if (err.name === "AbortError") throw new Error("Ollama API request timed out (60s)"); throw err; } finally { clearTimeout(timeout); }
  }
  isAvailable(): boolean { return true; }
}

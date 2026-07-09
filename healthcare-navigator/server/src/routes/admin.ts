import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  getProviders, setProviders, getApiKeys, addApiKey, removeApiKey, updateApiKey,
  validateModelName, validateApiKeyFormat,
} from "../config/providers";
import { getProviderStatus } from "../services/ai/providerManager";
import { createError } from "../middleware/errorHandler";
import { executeWithFailover } from "../services/ai/providerManager";
import { ChatMessage } from "../services/ai/types";

const router = Router();

function maskKey(key: string): string {
  if (key.length <= 12) return key.substring(0, 4) + "..." + key.substring(key.length - 2);
  return key.substring(0, 6) + "..." + key.substring(key.length - 4);
}

router.get("/providers", (_req: Request, res: Response) => {
  res.json(getProviders());
});

router.put("/providers", (req: Request, res: Response) => {
  const { providers } = req.body;
  if (!Array.isArray(providers)) {
    return res.status(400).json({ error: "providers array is required" });
  }

  for (const p of providers) {
    if (!p.id || !p.provider || !p.model) {
      return res.status(400).json({ error: `Invalid provider config: missing id/provider/model` });
    }
    if (!validateModelName(p.provider, p.model)) {
      return res.status(400).json({ error: `Invalid model "${p.model}" for provider "${p.provider}". Check the model name.` });
    }
    if (typeof p.priority !== "number" || p.priority < 1) {
      return res.status(400).json({ error: `Priority must be a positive number for ${p.provider}` });
    }
    if (typeof p.temperature !== "number" || p.temperature < 0 || p.temperature > 2) {
      return res.status(400).json({ error: `Temperature must be 0-2 for ${p.provider}` });
    }
  }

  setProviders(providers);
  res.json({ success: true, providers: getProviders() });
});

router.get("/providers/status", (_req: Request, res: Response) => {
  res.json(getProviderStatus());
});

router.get("/api-keys", (req: Request, res: Response) => {
  const providerId = req.query.providerId as string | undefined;
  let keys = getApiKeys();
  if (providerId) {
    keys = keys.filter((k) => k.providerId === providerId);
  }
  const safe = keys.map((k) => ({
    id: k.id,
    providerId: k.providerId,
    encryptedKey: maskKey(k.encryptedKey),
    active: k.active,
    priority: k.priority,
    lastUsed: k.lastUsed,
    rateLimitedUntil: k.rateLimitedUntil,
  }));
  res.json(safe);
});

router.post("/api-keys", (req: Request, res: Response) => {
  const { providerId, key, priority } = req.body;
  if (!providerId || !key || typeof key !== "string") {
    return res.status(400).json({ error: "providerId and key are required" });
  }

  if (key.length < 10) {
    return res.status(400).json({ error: "API key appears too short" });
  }

  const providers = getProviders();
  const providerConfig = providers.find((p) => p.id === providerId);
  if (providerConfig) {
    if (!validateApiKeyFormat(providerConfig.provider, key)) {
      const expected = providerConfig.provider === "nvidia" ? "nvapi-..." :
        providerConfig.provider === "openai" ? "sk-..." :
        providerConfig.provider === "groq" ? "gsk_..." :
        providerConfig.provider === "gemini" ? "AIza..." : "format varies";
      return res.status(400).json({ error: `Key format looks wrong for ${providerConfig.provider}. Expected prefix: ${expected}` });
    }
  }

  const existingKeys = getApiKeys().filter((k) => k.providerId === providerId);
  const entry = {
    id: uuidv4(),
    providerId,
    encryptedKey: key,
    active: true,
    priority: priority || existingKeys.length + 1,
    lastUsed: null,
    rateLimitedUntil: null,
  };
  addApiKey(entry);
  res.json({ success: true, id: entry.id });
});

router.delete("/api-keys/:id", (req: Request, res: Response) => {
  removeApiKey(req.params.id as string);
  res.json({ success: true });
});

router.put("/api-keys/:id", (req: Request, res: Response) => {
  const keys = getApiKeys();
  const key = keys.find((k) => k.id === (req.params.id as string));
  if (!key) return res.status(404).json({ error: "Key not found" });
  if (req.body.active !== undefined) updateApiKey(key.id, { active: req.body.active });
  if (req.body.priority !== undefined) updateApiKey(key.id, { priority: req.body.priority });
  if (req.body.key) updateApiKey(key.id, { encryptedKey: req.body.key });
  res.json({ success: true });
});

router.post("/test-connection", async (req: Request, res: Response) => {
  const start = Date.now();
  const providerName = req.body.provider;
  if (!providerName || typeof providerName !== "string") {
    return res.status(400).json({ success: false, error: "provider name is required" });
  }

  try {
    const messages: ChatMessage[] = [
      { role: "user", content: "Reply with exactly one word: OK" },
    ];
    const result = await executeWithFailover(messages, providerName);
    res.json({
      success: true,
      provider: result.meta.provider,
      model: result.meta.model,
      responseTime: Date.now() - start,
    });
  } catch (err: any) {
    res.json({
      success: false,
      error: err.message,
      responseTime: Date.now() - start,
    });
  }
});

export default router;

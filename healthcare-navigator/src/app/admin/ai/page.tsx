"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Save, Zap, Key, Activity, AlertCircle, CheckCircle,
  Loader2, Trash2, Plus, Eye, EyeOff, RotateCcw, Clock, Shield,
  ChevronUp, ChevronDown, RefreshCw, Server,
} from "lucide-react";

const API_BASE = "";

interface ProviderConfig {
  id: string;
  provider: string;
  enabled: boolean;
  priority: number;
  model: string;
  temperature: number;
  timeout: number;
  maxTokens: number;
}

interface ApiKeyEntry {
  id: string;
  providerId: string;
  encryptedKey: string;
  active: boolean;
  priority: number;
  lastUsed: string | null;
  rateLimitedUntil: string | null;
}

interface ProviderStatus {
  provider: string;
  enabled: boolean;
  priority: number;
  model: string;
  keyCount: number;
  activeKeys: number;
}

const PROVIDER_NAMES: Record<string, string> = {
  nvidia: "NVIDIA API Catalog",
  gemini: "Google Gemini",
  openai: "OpenAI",
  groq: "Groq",
  ollama: "Ollama (Local)",
  nim: "NVIDIA NIM",
  anthropic: "Anthropic (Claude)",
  together: "Together AI",
  deepseek: "DeepSeek",
};

const PROVIDER_COLORS: Record<string, string> = {
  nvidia: "#76b900",
  gemini: "#4285f4",
  openai: "#10a37f",
  groq: "#f55036",
  ollama: "#ffffff",
  nim: "#76b900",
  anthropic: "#d97706",
  together: "#6366f1",
  deepseek: "#3b82f6",
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function rateLimitStatus(key: ApiKeyEntry): { limited: boolean; text: string; color: string } {
  if (!key.rateLimitedUntil) return { limited: false, text: "OK", color: "#22c55e" };
  const until = new Date(key.rateLimitedUntil);
  if (until <= new Date()) return { limited: false, text: "OK", color: "#22c55e" };
  const mins = Math.ceil((until.getTime() - Date.now()) / 60000);
  return { limited: true, text: `Rate limited (${mins}m left)`, color: "#ef4444" };
}

export default function AISettingsPage() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [status, setStatus] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; time?: number }>>({});
  const [newKey, setNewKey] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [testAllRunning, setTestAllRunning] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [provRes, keysRes, statusRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/ai/providers`),
        fetch(`${API_BASE}/api/admin/ai/api-keys`),
        fetch(`${API_BASE}/api/admin/ai/providers/status`),
      ]);
      if (provRes.ok) setProviders(await provRes.json());
      if (keysRes.ok) setApiKeys(await keysRes.json());
      if (statusRes.ok) setStatus(await statusRes.json());
      setError("");
    } catch {
      setError("Failed to connect to AI server. Make sure it's running on port 4000.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API_BASE}/api/admin/ai/api-keys`)
        .then((r) => r.json())
        .then((data) => setApiKeys(data))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const saveProviders = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai/providers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providers }),
      });
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers);
        setSuccess("Configuration saved successfully");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Failed to save configuration");
    }
    setSaving(false);
  };

  const updateProvider = (id: string, field: keyof ProviderConfig, value: any) => {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const testConnection = async (provider: string) => {
    setTestResults((prev) => ({ ...prev, [provider]: { success: false, message: "Testing..." } }));
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai/test-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: data.success,
          message: data.success ? `Connected in ${data.responseTime}ms via ${data.model}` : data.error,
          time: data.responseTime,
        },
      }));
    } catch {
      setTestResults((prev) => ({ ...prev, [provider]: { success: false, message: "Connection failed - server may be down" } }));
    }
  };

  const testAllConnections = async () => {
    setTestAllRunning(true);
    const enabled = providers.filter((p) => p.enabled);
    for (const p of enabled) {
      await testConnection(p.provider);
    }
    setTestAllRunning(false);
  };

  const addApiKey = async (providerId: string) => {
    const key = newKey[providerId];
    if (!key) return;
    const providerConfig = providers.find((p) => p.provider === providerId);
    if (!providerConfig) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: providerConfig.id, key }),
      });
      if (res.ok) {
        setNewKey((prev) => ({ ...prev, [providerId]: "" }));
        setSuccess("API key added successfully");
        setTimeout(() => setSuccess(""), 3000);
        fetchData();
      }
    } catch {
      setError("Failed to add API key");
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/admin/ai/api-keys/${id}`, { method: "DELETE" });
      setSuccess("API key removed");
      setTimeout(() => setSuccess(""), 3000);
      fetchData();
    } catch {}
  };

  const toggleKeyActive = async (id: string, active: boolean) => {
    try {
      await fetch(`${API_BASE}/api/admin/ai/api-keys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      fetchData();
    } catch {}
  };

  const changeKeyPriority = async (id: string, newPriority: number) => {
    if (newPriority < 1) return;
    try {
      await fetch(`${API_BASE}/api/admin/ai/api-keys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      fetchData();
    } catch {}
  };

  const totalKeys = apiKeys.length;
  const activeKeys = apiKeys.filter((k) => k.active).length;
  const enabledProviders = providers.filter((p) => p.enabled).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f8fafc" }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: "#2563eb" }} />
          <p className="mt-3 text-[14px]" style={{ color: "#64748b" }}>Loading AI settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-[14px] mb-6" style={{ color: "#6B7280" }}>
          <ArrowLeft className="h-4 w-4" /> Back to Admin
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-bold" style={{ color: "#0f172a" }}>AI Settings</h1>
            <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>Configure AI providers, API keys, failover, and connection settings</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold" style={{ border: "1px solid #e5e7eb", color: "#475569" }}>
              <RotateCcw className="h-4 w-4" /> Refresh
            </button>
            <button onClick={testAllConnections} disabled={testAllRunning} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold" style={{ border: "1px solid #2563eb", color: "#2563eb" }}>
              {testAllRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />} Test All
            </button>
            <button onClick={saveProviders} disabled={saving} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold" style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
            <AlertCircle className="h-5 w-5 shrink-0" style={{ color: "#ef4444" }} />
            <p className="text-[14px] flex-1" style={{ color: "#dc2626" }}>{error}</p>
            <button onClick={() => setError("")} className="text-[13px] font-semibold" style={{ color: "#ef4444" }}>Dismiss</button>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <CheckCircle className="h-5 w-5 shrink-0" style={{ color: "#22c55e" }} />
            <p className="text-[14px]" style={{ color: "#166534" }}>{success}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl p-4 bg-white" style={{ border: "1px solid #e5e7eb" }}>
            <div className="flex items-center gap-2 mb-1"><Server className="h-4 w-4" style={{ color: "#2563eb" }} /><span className="text-[12px] font-semibold" style={{ color: "#64748b" }}>ACTIVE PROVIDERS</span></div>
            <p className="text-[24px] font-bold" style={{ color: "#0f172a" }}>{enabledProviders}<span className="text-[14px] font-normal" style={{ color: "#94a3b8" }}> / {providers.length}</span></p>
          </div>
          <div className="rounded-xl p-4 bg-white" style={{ border: "1px solid #e5e7eb" }}>
            <div className="flex items-center gap-2 mb-1"><Key className="h-4 w-4" style={{ color: "#22c55e" }} /><span className="text-[12px] font-semibold" style={{ color: "#64748b" }}>API KEYS</span></div>
            <p className="text-[24px] font-bold" style={{ color: "#0f172a" }}>{activeKeys}<span className="text-[14px] font-normal" style={{ color: "#94a3b8" }}> active / {totalKeys} total</span></p>
          </div>
          <div className="rounded-xl p-4 bg-white" style={{ border: "1px solid #e5e7eb" }}>
            <div className="flex items-center gap-2 mb-1"><Shield className="h-4 w-4" style={{ color: "#f59e0b" }} /><span className="text-[12px] font-semibold" style={{ color: "#64748b" }}>FAILOVER</span></div>
            <p className="text-[24px] font-bold" style={{ color: "#0f172a" }}>{enabledProviders > 1 ? "Enabled" : "Single"}</p>
            <p className="text-[11px]" style={{ color: "#94a3b8" }}>{enabledProviders > 1 ? `Auto-switch on failure` : "Add more providers for failover"}</p>
          </div>
        </div>

        <div className="mb-4 rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
          <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "#d97706" }} />
          <p className="text-[12px]" style={{ color: "#92400e" }}>
            Add multiple API keys per provider as backups. Keys are tried in priority order (1 = first). If one key hits a rate limit, the system automatically switches to the next key.
          </p>
        </div>

        <div className="space-y-6">
          {providers.map((prov) => {
            const provKeys = apiKeys.filter((k) => k.providerId === prov.id).sort((a, b) => a.priority - b.priority);
            const provStatus = status.find((s) => s.provider === prov.provider);
            const testResult = testResults[prov.provider];
            const providerColor = PROVIDER_COLORS[prov.provider] || "#2563eb";

            return (
              <div key={prov.id} className="rounded-2xl bg-white p-6" style={{ border: prov.enabled ? `2px solid ${providerColor}20` : "1px solid #e5e7eb" }}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: prov.enabled ? `${providerColor}15` : "#f1f5f9" }}>
                      <Zap className="h-5 w-5" style={{ color: prov.enabled ? providerColor : "#94a3b8" }} />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-semibold" style={{ color: "#0f172a" }}>{PROVIDER_NAMES[prov.provider] || prov.provider}</h3>
                      <div className="flex items-center gap-3 text-[12px]" style={{ color: "#64748b" }}>
                        <span>Priority #{prov.priority}</span>
                        <span>·</span>
                        <span>{provKeys.length} key{provKeys.length !== 1 ? "s" : ""}</span>
                        <span>·</span>
                        <span style={{ color: provStatus?.activeKeys ? "#22c55e" : "#94a3b8" }}>{provStatus?.activeKeys || 0} active</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => testConnection(prov.provider)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors" style={{ border: "1px solid #e5e7eb", color: "#475569" }}>
                      <Activity className="h-3.5 w-3.5" /> Test
                    </button>
                    <button onClick={() => updateProvider(prov.id, "enabled", !prov.enabled)} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" style={{ backgroundColor: prov.enabled ? providerColor : "#d1d5db" }}>
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" style={{ transform: prov.enabled ? "translateX(22px)" : "translateX(2px)" }} />
                    </button>
                  </div>
                </div>

                {testResult && (
                  <div className="mb-4 rounded-lg p-3 flex items-center gap-2 text-[13px]" style={{ backgroundColor: testResult.success ? "#f0fdf4" : "#fef2f2", border: `1px solid ${testResult.success ? "#bbf7d0" : "#fecaca"}` }}>
                    {testResult.success ? <CheckCircle className="h-4 w-4" style={{ color: "#22c55e" }} /> : <AlertCircle className="h-4 w-4" style={{ color: "#ef4444" }} />}
                    <span style={{ color: testResult.success ? "#166534" : "#dc2626" }}>{testResult.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  <div>
                    <label className="block text-[12px] font-semibold mb-1" style={{ color: "#64748b" }}>Model</label>
                    <input value={prov.model} onChange={(e) => updateProvider(prov.id, "model", e.target.value)} className="w-full rounded-lg px-3 py-2 text-[13px]" style={{ border: "1px solid #e5e7eb", outline: "none" }} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1" style={{ color: "#64748b" }}>Priority (failover order)</label>
                    <input type="number" min="1" value={prov.priority} onChange={(e) => updateProvider(prov.id, "priority", parseInt(e.target.value) || 1)} className="w-full rounded-lg px-3 py-2 text-[13px]" style={{ border: "1px solid #e5e7eb", outline: "none" }} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1" style={{ color: "#64748b" }}>Temperature</label>
                    <input type="number" step="0.1" min="0" max="2" value={prov.temperature} onChange={(e) => updateProvider(prov.id, "temperature", parseFloat(e.target.value) || 0.3)} className="w-full rounded-lg px-3 py-2 text-[13px]" style={{ border: "1px solid #e5e7eb", outline: "none" }} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1" style={{ color: "#64748b" }}>Max Tokens</label>
                    <input type="number" min="256" max="16384" value={prov.maxTokens} onChange={(e) => updateProvider(prov.id, "maxTokens", parseInt(e.target.value) || 2048)} className="w-full rounded-lg px-3 py-2 text-[13px]" style={{ border: "1px solid #e5e7eb", outline: "none" }} />
                  </div>
                </div>

                <div className="border-t pt-4" style={{ borderColor: "#f1f5f9" }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[13px] font-semibold" style={{ color: "#475569" }}>API Keys (Backup Support)</h4>
                    <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: prov.enabled ? "#dcfce7" : "#f1f5f9", color: prov.enabled ? "#166534" : "#94a3b8" }}>
                      {prov.enabled ? "Live" : "Disabled"}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    {provKeys.map((k, idx) => {
                      const rl = rateLimitStatus(k);
                      return (
                        <div key={k.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ backgroundColor: rl.limited ? "#fef2f2" : "#f8fafc", border: rl.limited ? "1px solid #fecaca" : "1px solid transparent" }}>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: idx === 0 ? "#dbeafe" : "#f1f5f9", color: idx === 0 ? "#2563eb" : "#64748b" }}>
                              #{k.priority}
                            </span>
                            {idx === 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>PRIMARY</span>}
                            {idx > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>BACKUP</span>}
                          </div>

                          <Key className="h-3.5 w-3.5 shrink-0" style={{ color: "#94a3b8" }} />
                          <span className="flex-1 text-[12px] font-mono" style={{ color: "#475569" }}>
                            {showKeys[k.id] ? k.encryptedKey : k.encryptedKey.replace(/./g, "•")}
                          </span>

                          <span className="text-[11px] px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: rl.limited ? "#fee2e2" : k.active ? "#dcfce7" : "#f1f5f9", color: rl.limited ? "#dc2626" : k.active ? "#166534" : "#94a3b8" }}>
                            {rl.limited ? rl.text : k.active ? "Active" : "Disabled"}
                          </span>

                          <span className="text-[11px] shrink-0 flex items-center gap-1" style={{ color: "#94a3b8" }}>
                            <Clock className="h-3 w-3" /> {timeAgo(k.lastUsed)}
                          </span>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button onClick={() => changeKeyPriority(k.id, k.priority - 1)} className="p-0.5" disabled={k.priority <= 1}><ChevronUp className="h-3.5 w-3.5" style={{ color: k.priority <= 1 ? "#d1d5db" : "#64748b" }} /></button>
                            <button onClick={() => changeKeyPriority(k.id, k.priority + 1)} className="p-0.5"><ChevronDown className="h-3.5 w-3.5" style={{ color: "#64748b" }} /></button>
                          </div>

                          <button onClick={() => setShowKeys((p) => ({ ...p, [k.id]: !p[k.id] }))} className="p-1 shrink-0">
                            {showKeys[k.id] ? <EyeOff className="h-3.5 w-3.5" style={{ color: "#94a3b8" }} /> : <Eye className="h-3.5 w-3.5" style={{ color: "#94a3b8" }} />}
                          </button>
                          <button onClick={() => toggleKeyActive(k.id, !k.active)} className="text-[11px] font-semibold px-2 py-0.5 rounded shrink-0" style={{ color: k.active ? "#dc2626" : "#22c55e" }}>
                            {k.active ? "Disable" : "Enable"}
                          </button>
                          <button onClick={() => deleteApiKey(k.id)} className="p-1 shrink-0"><Trash2 className="h-3.5 w-3.5" style={{ color: "#ef4444" }} /></button>
                        </div>
                      );
                    })}
                    {provKeys.length === 0 && (
                      <p className="text-[12px] py-2" style={{ color: "#94a3b8" }}>No API keys configured. Add one below.</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder={`Add ${PROVIDER_NAMES[prov.provider] || prov.provider} API key...`}
                      value={newKey[prov.provider] || ""}
                      onChange={(e) => setNewKey((p) => ({ ...p, [prov.provider]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addApiKey(prov.provider)}
                      className="flex-1 rounded-lg px-3 py-2 text-[13px]"
                      style={{ border: "1px solid #e5e7eb", outline: "none" }}
                    />
                    <button
                      onClick={() => addApiKey(prov.provider)}
                      disabled={!newKey[prov.provider]}
                      className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-semibold transition-colors"
                      style={{ backgroundColor: newKey[prov.provider] ? "#2563eb" : "#e5e7eb", color: newKey[prov.provider] ? "#ffffff" : "#94a3b8" }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Key
                    </button>
                  </div>
                  <p className="text-[11px] mt-2" style={{ color: "#94a3b8" }}>
                    {provKeys.length === 0 ? "Add your first API key to enable this provider" : `Add a backup key for automatic failover. Keys are tried in priority order.`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

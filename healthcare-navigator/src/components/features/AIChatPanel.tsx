"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, Copy, Trash2, Bot, User, Stethoscope } from "lucide-react";
import { apiFetch } from "@/lib/api";

const STORAGE_KEY = "healthnav-ai-chat";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function renderMarkdown(text: string) {
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:#f1f5f9;padding:1px 4px;border-radius:4px;font-size:13px;">$1</code>')
    .replace(/^### (.*$)/gm, '<h3 style="font-size:15px;font-weight:600;margin:8px 0 4px;">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 style="font-size:16px;font-weight:600;margin:10px 0 4px;">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 style="font-size:17px;font-weight:600;margin:12px 0 4px;">$1</h1>')
    .replace(/^- (.*$)/gm, '<li style="margin-left:16px;margin-bottom:2px;">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li style="margin-left:16px;margin-bottom:2px;">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  return html;
}

export default function AIChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setMessages(data.messages || []);
        setConversationId(data.conversationId);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, conversationId }));
    } catch {}
  }, [messages, conversationId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = { id: generateId(), role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const res = await apiFetch("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: text, conversationId, history }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: Message = { id: generateId(), role: "assistant", content: data.response, timestamp: Date.now() };
      setMessages((prev) => [...prev, assistantMsg]);
      setConversationId(data.conversationId);
    } catch (err: any) {
      const errorMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: `I'm sorry, I encountered an error: ${err.message || "Unknown error"}. Please make sure the AI server is running on port 4000 and try again.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(undefined);
    localStorage.removeItem(STORAGE_KEY);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3.5 text-[14px] font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105"
        style={{ backgroundColor: isOpen ? "#0f172a" : "#2563eb", color: "#ffffff" }}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Stethoscope className="h-5 w-5" />}
        <span className="hidden sm:inline">{isOpen ? "Close" : "AI Health Guide"}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={() => setIsOpen(false)} />
          <div
            className="fixed inset-0 z-50 flex flex-col sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:h-auto sm:max-h-[600px] sm:rounded-2xl sm:shadow-2xl"
            style={{ height: "100dvh", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "0" }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: "#dbeafe" }}>
                  <Stethoscope className="h-5 w-5" style={{ color: "#2563eb" }} />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold" style={{ color: "#0f172a" }}>AI Health Guide</h3>
                  <p className="text-[12px]" style={{ color: "#94a3b8" }}>Healthcare navigation assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={clearChat} className="p-2 rounded-lg transition-colors" style={{ color: "#94a3b8" }} title="Clear conversation">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg sm:hidden" style={{ color: "#94a3b8" }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ scrollBehavior: "smooth" }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4" style={{ backgroundColor: "#dbeafe" }}>
                    <Stethoscope className="h-7 w-7" style={{ color: "#2563eb" }} />
                  </div>
                  <h3 className="text-[17px] font-semibold mb-2" style={{ color: "#0f172a" }}>How can I help you?</h3>
                  <p className="text-[13px] leading-relaxed mb-5" style={{ color: "#64748b" }}>
                    I can help you find the right specialist, understand health topics, or navigate our platform.
                  </p>
                  <div className="space-y-2 w-full max-w-xs">
                    {["What specialist should I see for chest pain?", "Find a cardiologist in Dhaka", "What is a gastroenterologist?"].map((q) => (
                      <button key={q} onClick={() => { setInput(q); }} className="w-full rounded-xl px-4 py-2.5 text-[13px] text-left transition-colors" style={{ border: "1px solid #e5e7eb", color: "#475569" }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full shrink-0 mt-0.5" style={{ backgroundColor: "#dbeafe" }}>
                      <Bot className="h-3.5 w-3.5" style={{ color: "#2563eb" }} />
                    </div>
                  )}
                  <div className={`max-w-[80%] group ${msg.role === "user" ? "" : ""}`}>
                    <div
                      className="rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed"
                      style={{
                        backgroundColor: msg.role === "user" ? "#2563eb" : "#f8fafc",
                        color: msg.role === "user" ? "#ffffff" : "#1e293b",
                        borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        border: msg.role === "user" ? "none" : "1px solid #e5e7eb",
                      }}
                      dangerouslySetInnerHTML={{ __html: msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content }}
                    />
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyMessage(msg.content)} className="flex items-center gap-1 text-[11px]" style={{ color: "#94a3b8" }}>
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full shrink-0 mt-0.5" style={{ backgroundColor: "#0f172a" }}>
                      <User className="h-3.5 w-3.5" style={{ color: "#ffffff" }} />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: "#dbeafe" }}>
                    <Bot className="h-3.5 w-3.5" style={{ color: "#2563eb" }} />
                  </div>
                  <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "18px 18px 18px 4px" }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#94a3b8", animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#94a3b8", animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#94a3b8", animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3" style={{ borderTop: "1px solid #f1f5f9" }}>
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about symptoms, specialists, or hospitals..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl px-4 py-2.5 text-[13.5px] leading-relaxed"
                  style={{ border: "1px solid #e5e7eb", outline: "none", maxHeight: "100px", backgroundColor: "#ffffff" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition-colors"
                  style={{
                    backgroundColor: input.trim() && !isTyping ? "#2563eb" : "#e5e7eb",
                    color: input.trim() && !isTyping ? "#ffffff" : "#94a3b8",
                  }}
                >
                  {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] mt-2 text-center" style={{ color: "#94a3b8" }}>
                AI-powered healthcare guidance. Not a substitute for professional medical advice.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}

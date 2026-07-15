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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMarkdown(text: string) {
  let html = escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-[#F1F5F9] px-1 py-0.5 rounded text-xs">$1</code>')
    .replace(/^### (.*$)/gm, '<h3 class="text-sm font-semibold mt-2 mb-1">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-base font-semibold mt-2 mb-1">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-lg font-semibold mt-3 mb-1">$1</h1>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 mb-0.5">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 mb-0.5">$1</li>')
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
        content: `I'm sorry, I encountered an error. Please try again later.`,
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
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-105 bg-[#0066FF] text-white"
        aria-label={isOpen ? "Close AI chat" : "Open AI Health Guide"}
        aria-expanded={isOpen}
        aria-controls="ai-chat-panel"
      >
        {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Stethoscope className="h-5 w-5" aria-hidden="true" />}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 sm:hidden animate-fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            id="ai-chat-panel"
            className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:h-auto sm:max-h-[600px] sm:rounded-[12px] sm:shadow-[0px_12px_40px_rgba(0,0,0,0.12)] border border-[#E2E8F0] animate-slide-up"
            role="dialog"
            aria-label="AI Health Guide chat"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#E8F0FF]">
                  <Stethoscope className="h-5 w-5 text-[#0066FF]" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1E293B]">AI Health Guide</h3>
                  <p className="text-xs text-[#64748B]">Healthcare navigation assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={clearChat}
                  className="p-2 rounded-[8px] text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
                  aria-label="Clear conversation"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-[8px] text-[#64748B] hover:bg-[#F1F5F9] transition-colors sm:hidden"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scroll-smooth"
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[12px] bg-[#E8F0FF] mb-4">
                    <Stethoscope className="h-7 w-7 text-[#0066FF]" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-[#1E293B]">How can I help you?</h3>
                  <p className="text-sm leading-relaxed mb-5 text-[#64748B]">
                    I can help you find the right specialist, understand health topics, or navigate our platform.
                  </p>
                  <div className="space-y-2 w-full max-w-xs">
                    {["What specialist should I see for chest pain?", "Find a cardiologist in Dhaka", "What is a gastroenterologist?"].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); }}
                        className="w-full rounded-[8px] px-4 py-2.5 text-sm text-left border border-[#E2E8F0] text-[#1E293B] hover:bg-[#F8FAFC] transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full shrink-0 mt-0.5 bg-[#E8F0FF]">
                      <Bot className="h-3.5 w-3.5 text-[#0066FF]" aria-hidden="true" />
                    </div>
                  )}
                  <div className="max-w-[80%] group">
                    <div
                      className={`rounded-[12px] px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#0066FF] text-white rounded-br-sm"
                          : "bg-[#F8FAFC] text-[#1E293B] border border-[#E2E8F0] rounded-bl-sm"
                      }`}
                      dangerouslySetInnerHTML={{ __html: msg.role === "assistant" ? renderMarkdown(msg.content) : escapeHtml(msg.content) }}
                    />
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => copyMessage(msg.content)}
                          className="flex items-center gap-1 text-xs text-[#64748B] hover:text-[#1E293B]"
                          aria-label="Copy message"
                        >
                          <Copy className="h-3 w-3" aria-hidden="true" /> Copy
                        </button>
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full shrink-0 mt-0.5 bg-[#0B1324]">
                      <User className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full shrink-0 bg-[#E8F0FF]">
                    <Bot className="h-3.5 w-3.5 text-[#0066FF]" aria-hidden="true" />
                  </div>
                  <div className="rounded-[12px] rounded-bl-sm px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="flex items-center gap-1.5" aria-label="AI is typing">
                      <div className="w-2 h-2 rounded-full bg-[#94A3B8] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-[#94A3B8] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-[#94A3B8] animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-[#E2E8F0]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about symptoms, specialists, or hospitals..."
                  rows={1}
                  aria-label="Type your message"
                  className="flex-1 resize-none rounded-[8px] border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-[#0066FF] focus:shadow-[0_0_0_3px_rgba(0,102,255,0.12)] max-h-[100px]"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className="flex h-10 w-10 items-center justify-center rounded-[8px] shrink-0 transition-colors bg-[#0066FF] text-white disabled:bg-[#F1F5F9] disabled:text-[#94A3B8]"
                  aria-label="Send message"
                >
                  {isTyping ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              <p className="text-xs mt-2 text-center text-[#94A3B8]">
                AI-powered healthcare guidance. Not a substitute for professional medical advice.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface LanguageSwitcherProps {
  variant?: "public" | "admin";
}

const languages = [
  { code: "en" as const, label: "English", flag: "EN" },
  { code: "bn" as const, label: "বাংলা", flag: "বাং" },
];

export default function LanguageSwitcher({ variant = "public" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const current = languages.find((l) => l.code === language) || languages[0];

  if (variant === "admin") {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors"
          style={{
            backgroundColor: open ? "#f1f5f9" : "transparent",
            color: "#64748b",
          }}
          aria-label="Switch language"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <Globe className="h-3.5 w-3.5" />
          <span>{current.flag}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-1 z-50 w-[140px] rounded-xl overflow-hidden"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            }}
            role="listbox"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] font-medium text-left transition-colors"
                style={{
                  backgroundColor: language === lang.code ? "#eff6ff" : "transparent",
                  color: language === lang.code ? "#2563eb" : "#374151",
                }}
                role="option"
                aria-selected={language === lang.code}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors"
        style={{
          backgroundColor: "#1e293b",
          color: "#ffffff",
        }}
        aria-label="Switch language"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{current.flag}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-[150px] rounded-xl overflow-hidden"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          }}
          role="listbox"
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setOpen(false);
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[14px] font-medium text-left transition-colors"
              style={{
                backgroundColor: language === lang.code ? "#eff6ff" : "transparent",
                color: language === lang.code ? "#2563eb" : "#374151",
              }}
              role="option"
              aria-selected={language === lang.code}
            >
              <span className="text-[13px] font-bold" style={{ color: language === lang.code ? "#2563eb" : "#6B7280" }}>
                {lang.flag}
              </span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

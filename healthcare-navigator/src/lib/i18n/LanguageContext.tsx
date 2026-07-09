"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import en from "@/lib/i18n/en.json";
import bn from "@/lib/i18n/bn.json";

type Language = "en" | "bn";

const translations: Record<Language, typeof en> = { en, bn };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof en;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("healthnav-lang") as Language | null;
    if (stored && (stored === "en" || stored === "bn")) {
      setLanguageState(stored);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = language === "bn" ? "bn" : "en";
    localStorage.setItem("healthnav-lang", language);
  }, [language, mounted]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language: "en", setLanguage, t: en, dir: "ltr" }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language], dir: "ltr" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

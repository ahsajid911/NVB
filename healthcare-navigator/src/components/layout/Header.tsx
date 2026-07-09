"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, Stethoscope, HeartPulse, Building2, User } from "lucide-react";
import LanguageSwitcher from "@/components/features/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  const navLinks = [
    { href: "/doctors", label: t.nav.findDoctors },
    { href: "/specialties", label: t.nav.specialties },
    { href: "/hospitals", label: t.nav.hospitals },
    { href: "/symptom-assistant", label: t.nav.symptomAssistant },
    { href: "/ai-symptom-checker", label: "AI Symptom Check" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top nav */}
      <nav style={{ backgroundColor: "#0f172a" }} className="h-12 flex items-center">
        <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <Link href="/" className="flex items-center shrink-0">
            <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-semibold" style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
              <Stethoscope className="h-4 w-4" />
              {t.common.appName}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] font-medium transition-colors"
                style={{ color: "#ffffff" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/doctors"
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors"
              style={{ backgroundColor: "#1e293b", color: "#ffffff" }}
            >
              <Search className="h-3.5 w-3.5" />
              {t.common.search}
            </Link>
            <LanguageSwitcher variant="public" />
          </div>

          <button
            className="md:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{ color: "#ffffff" }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 pt-2" style={{ backgroundColor: "#0f172a", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-3 text-[14px] font-medium min-h-[44px] flex items-center"
              style={{ color: "#ffffff" }}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 pt-3 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <Link href="/ai-symptom-checker" onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold min-h-[44px]"
              style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
              <HeartPulse className="h-4 w-4" /> AI Symptom Check
            </Link>
            <Link href="/doctors" onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold min-h-[44px]"
              style={{ border: "1px solid rgba(255,255,255,0.3)", color: "#ffffff" }}>
              <User className="h-4 w-4" /> {t.hero.findDoctorCTA}
            </Link>
            <Link href="/hospitals" onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold min-h-[44px]"
              style={{ border: "1px solid rgba(255,255,255,0.3)", color: "#ffffff" }}>
              <Building2 className="h-4 w-4" /> {t.hero.findHospitalCTA}
            </Link>
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <LanguageSwitcher variant="public" />
          </div>
        </div>
      )}

      {/* Sub-nav */}
      <div className="hidden sm:block bg-white" style={{ borderBottom: "1px solid #e5e7eb" }}>
        <div className="mx-auto flex h-[60px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: "#dbeafe" }}>
              <Stethoscope className="h-5 w-5" style={{ color: "#2563eb" }} />
            </div>
            <div className="flex flex-col">
              <span className="text-[20px] font-bold leading-tight" style={{ color: "#111827" }}>
                {t.common.appName}
              </span>
              <span className="text-[12px] font-medium leading-tight" style={{ color: "#6B7280" }}>
                {t.common.tagline}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/symptom-assistant"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[14px] font-semibold transition-colors"
              style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
            >
              <HeartPulse className="h-4 w-4" />
              {t.hero.symptomCTA}
            </Link>

            <div className="mx-1 h-6 w-px" style={{ backgroundColor: "#e5e7eb" }} />

            <Link
              href="/doctors"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-[14px] font-semibold transition-colors"
              style={{ border: "1px solid #2563eb", color: "#2563eb" }}
            >
              <User className="h-4 w-4" />
              {t.hero.findDoctorCTA}
            </Link>

            <Link
              href="/hospitals"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-[14px] font-semibold transition-colors"
              style={{ border: "1px solid #2563eb", color: "#2563eb" }}
            >
              <Building2 className="h-4 w-4" />
              {t.hero.findHospitalCTA}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Search, Stethoscope, HeartPulse, Building2, User } from "lucide-react";
import LanguageSwitcher from "@/components/features/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/doctors?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/doctors");
    }
    setSearchOpen(false);
    setSearchQuery("");
  };

  const navLinks = [
    { href: "/doctors", label: t.nav.findDoctors },
    { href: "/specialties", label: t.nav.specialties },
    { href: "/hospitals", label: t.nav.hospitals },
    { href: "/ai-symptom-checker", label: "AI Symptom Check" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top nav */}
      <nav className="bg-[#0f172a]/95 backdrop-blur-md h-12 flex items-center" aria-label="Main navigation">
        <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <Link href="/" className="flex items-center shrink-0" aria-label={t.common.appName}>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
              <Stethoscope className="h-4 w-4" aria-hidden="true" />
              {t.common.appName}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7" aria-label="Page navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white transition-colors hover:text-white/80"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search doctors, specialties..."
                  className="rounded-full bg-slate-800 px-4 py-1.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary w-64"
                  onBlur={() => {
                    if (!searchQuery) setSearchOpen(false);
                  }}
                />
                <button
                  type="submit"
                  className="ml-2 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  aria-label="Submit search"
                >
                  <Search className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="ml-1 p-1.5 rounded-full text-slate-400 hover:text-white"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                aria-label="Open search"
              >
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                {t.common.search}
              </button>
            )}
            <LanguageSwitcher variant="public" />
          </div>

          <button
            className="md:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="md:hidden bg-[#0f172a] px-4 pb-4 pt-2 border-t border-white/10"
          role="menu"
        >
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="mb-3">
            <div className="flex items-center rounded-full bg-slate-800 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400 mr-2" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctors..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </form>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-3 text-sm font-medium text-white min-h-[44px] flex items-center"
              onClick={() => setMobileOpen(false)}
              role="menuitem"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 pt-3 flex flex-col gap-2 border-t border-white/10">
            <Link href="/ai-symptom-checker" onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground min-h-[44px]"
              role="menuitem">
              <HeartPulse className="h-4 w-4" aria-hidden="true" /> AI Symptom Check
            </Link>
            <Link href="/doctors" onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-4 py-2.5 text-sm font-semibold text-white min-h-[44px]"
              role="menuitem">
              <User className="h-4 w-4" aria-hidden="true" /> {t.hero.findDoctorCTA}
            </Link>
            <Link href="/hospitals" onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-4 py-2.5 text-sm font-semibold text-white min-h-[44px]"
              role="menuitem">
              <Building2 className="h-4 w-4" aria-hidden="true" /> {t.hero.findHospitalCTA}
            </Link>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <LanguageSwitcher variant="public" />
          </div>
        </div>
      )}

      {/* Sub-nav */}
      <div className="hidden sm:block bg-white/95 backdrop-blur-md border-b border-border">
        <div className="mx-auto flex h-[60px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Stethoscope className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold leading-tight text-foreground">
                {t.common.appName}
              </span>
              <span className="text-xs font-medium leading-tight text-muted-foreground">
                {t.common.tagline}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/ai-symptom-checker"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <HeartPulse className="h-4 w-4" aria-hidden="true" />
              {t.hero.symptomCTA}
            </Link>

            <div className="mx-1 h-6 w-px bg-border" />

            <Link
              href="/doctors"
              className="inline-flex items-center gap-2 rounded-full border border-primary bg-white px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              {t.hero.findDoctorCTA}
            </Link>

            <Link
              href="/hospitals"
              className="inline-flex items-center gap-2 rounded-full border border-primary bg-white px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              <Building2 className="h-4 w-4" aria-hidden="true" />
              {t.hero.findHospitalCTA}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

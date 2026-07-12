"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, HeartPulse, Stethoscope, Building2, Users, Activity } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function HeroSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { t } = useLanguage();

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/doctors?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/doctors");
    }
  }, [query, router]);

  const handleQuickSearch = useCallback((term: string) => {
    router.push(`/doctors?q=${encodeURIComponent(term)}`);
  }, [router]);

  const stats = [
    { icon: <Users className="h-5 w-5" />, value: "50+", label: t.hero.statDoctors },
    { icon: <Building2 className="h-5 w-5" />, value: "20+", label: t.hero.statHospitals },
    { icon: <Stethoscope className="h-5 w-5" />, value: "15+", label: t.hero.statSpecialties },
    { icon: <Activity className="h-5 w-5" />, value: "100+", label: t.hero.statMappings },
  ];

  return (
    <section className="bg-gradient-to-b from-[#0B1324] to-[#0F1A33]">
      <div className="mx-auto max-w-[1440px] px-6 pt-28 pb-20 lg:px-10 lg:pt-36 lg:pb-28">
        <div className="text-center">
          <h1 className="text-[36px] font-semibold sm:text-[44px] lg:text-[56px] leading-[1.07] tracking-[-0.28px] text-white">
            {t.hero.title}
            <br className="hidden sm:block" />
            <span className="text-blue-400"> {t.hero.titleHighlight}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[18px] leading-[1.6] text-slate-300">
            {t.hero.description}
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mx-auto mt-10 max-w-xl">
            <div className="flex items-center rounded-full bg-white px-2 py-1.5 shadow-lg shadow-black/20">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.hero.placeholder}
                className="flex-1 bg-transparent px-5 py-3 text-[17px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
                aria-label="Search for doctors, specialties, or hospitals"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-[17px] font-semibold text-white transition-colors hover:bg-blue-700"
                aria-label="Search"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
                <span className="hidden sm:inline">{t.common.search}</span>
              </button>
            </div>
          </form>

          {/* Popular tags */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[14px] text-slate-300">
            <span>{t.common.popular}</span>
            {["Cardiologist in Dhaka", "Skin Specialist", "Chest Pain", "Orthopedic Surgeon"].map((s) => (
              <button
                key={s}
                onClick={() => handleQuickSearch(s)}
                className="rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-white/20"
              >
                {s}
              </button>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/ai-symptom-checker"
              className="inline-flex items-center gap-2.5 rounded-full bg-blue-600 px-8 py-3.5 text-[16px] font-semibold text-white transition-colors shadow-lg hover:bg-blue-700"
            >
              <HeartPulse className="h-5 w-5" aria-hidden="true" />
              {t.hero.symptomCTA}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <Link
              href="/doctors"
              className="inline-flex items-center gap-2.5 rounded-full border-2 border-blue-600 bg-white px-8 py-3.5 text-[16px] font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              <Stethoscope className="h-5 w-5" aria-hidden="true" />
              {t.hero.findDoctorCTA}
            </Link>

            <Link
              href="/hospitals"
              className="inline-flex items-center gap-2.5 rounded-full border-2 border-blue-600 bg-white px-8 py-3.5 text-[16px] font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              <Building2 className="h-5 w-5" aria-hidden="true" />
              {t.hero.findHospitalCTA}
            </Link>
          </div>

          {/* Trust stats */}
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-2xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/5 border border-white/10 px-5 py-4">
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  {stat.icon}
                  <span className="text-[24px] font-bold text-white">{stat.value}</span>
                </div>
                <p className="mt-1 text-[13px] text-slate-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

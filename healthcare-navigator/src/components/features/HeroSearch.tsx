"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, HeartPulse, Stethoscope, Building2, Users, Activity } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function HeroSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { t } = useLanguage();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/doctors?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/doctors");
    }
  };

  const stats = [
    { icon: <Users className="h-5 w-5" />, value: "50+", label: t.hero.statDoctors },
    { icon: <Building2 className="h-5 w-5" />, value: "20+", label: t.hero.statHospitals },
    { icon: <Stethoscope className="h-5 w-5" />, value: "15+", label: t.hero.statSpecialties },
    { icon: <Activity className="h-5 w-5" />, value: "100+", label: t.hero.statMappings },
  ];

  return (
    <section style={{ background: "linear-gradient(180deg, #0B1324 0%, #0F1A33 100%)" }}>
      <div className="mx-auto max-w-[1440px] px-6 pt-28 pb-20 lg:px-10 lg:pt-36 lg:pb-28">
        <div className="text-center">
          <h1 className="text-[36px] font-semibold sm:text-[44px] lg:text-[56px] leading-[1.07] tracking-[-0.28px]" style={{ color: "#ffffff" }}>
            {t.hero.title}
            <br className="hidden sm:block" />
            <span style={{ color: "#60A5FA" }}> {t.hero.titleHighlight}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[18px] leading-[1.6]" style={{ color: "#CBD5E1" }}>
            {t.hero.description}
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mx-auto mt-10 max-w-xl">
            <div className="flex items-center rounded-full bg-white px-2 py-1.5 shadow-lg" style={{ boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.hero.placeholder}
                className="flex-1 bg-transparent px-5 py-3 text-[17px] focus:outline-none"
                style={{ color: "#111827" }}
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[17px] font-semibold transition-colors"
                style={{ backgroundColor: "#2563EB", color: "#ffffff" }}
              >
                <Search className="h-5 w-5" />
                <span className="hidden sm:inline">{t.common.search}</span>
              </button>
            </div>
          </form>

          {/* Popular tags */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[14px]" style={{ color: "#CBD5E1" }}>
            <span>{t.common.popular}</span>
            {["Cardiologist in Dhaka", "Skin Specialist", "Chest Pain", "Orthopedic Surgeon"].map((s) => (
              <Link
                key={s}
                href={`/doctors?q=${encodeURIComponent(s)}`}
                className="rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}
              >
                {s}
              </Link>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/symptom-assistant"
              className="inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 text-[16px] font-semibold transition-colors shadow-lg"
              style={{ backgroundColor: "#2563EB", color: "#ffffff" }}
            >
              <HeartPulse className="h-5 w-5" />
              {t.hero.symptomCTA}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/doctors"
              className="inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-3.5 text-[16px] font-semibold transition-colors"
              style={{ border: "2px solid #2563EB", color: "#2563EB" }}
            >
              <Stethoscope className="h-5 w-5" />
              {t.hero.findDoctorCTA}
            </Link>

            <Link
              href="/hospitals"
              className="inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-3.5 text-[16px] font-semibold transition-colors"
              style={{ border: "2px solid #2563EB", color: "#2563EB" }}
            >
              <Building2 className="h-5 w-5" />
              {t.hero.findHospitalCTA}
            </Link>
          </div>

          {/* Trust stats */}
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-2xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl px-5 py-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex items-center justify-center gap-2" style={{ color: "#60A5FA" }}>
                  {stat.icon}
                  <span className="text-[24px] font-bold" style={{ color: "#ffffff" }}>{stat.value}</span>
                </div>
                <p className="mt-1 text-[13px]" style={{ color: "#CBD5E1" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { getAllHospitals } from "@/services/data";
import { MapPin, Phone, Building2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { localizeHospitalWithDistrict } from "@/lib/localize";

export default function HospitalsPage() {
  const hospitals = getAllHospitals();
  const { t, language } = useLanguage();

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
      <div className="mb-8">
        <h1
          className="text-[24px] font-semibold text-[#0f172a] sm:text-[36px] md:text-[44px] tracking-[-0.374px]"
          style={{ fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif' }}
        >
          {t.hospitals.title}
        </h1>
        <p className="mt-3 text-[15px] sm:text-[18px] text-[#64748b]">{t.hospitals.subtitle.replace("{count}", hospitals.length.toString())}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {hospitals.map((hospital, index) => {
          const locHospital = localizeHospitalWithDistrict(hospital, language);
          const typeColors: Record<string, string> = {
            private: "from-emerald-500 to-emerald-600",
            government: "from-blue-500 to-blue-600",
            "semi-government": "from-purple-500 to-purple-600",
            ngo: "from-orange-500 to-orange-600",
          };
          const colorClass = typeColors[hospital.type] || "from-slate-500 to-slate-600";
          return (
          <Link key={hospital.id} href={`/hospitals/${hospital.id}`} className="group rounded-2xl bg-white border border-border p-7 card-hover stagger-item">
            <div className="flex items-start gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${colorClass} text-white shrink-0`}><Building2 className="h-6 w-6" /></div>
              <div className="min-w-0"><h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">{locHospital.name}</h2><span className="mt-1 inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground capitalize">{(t.hospitals.filters as Record<string, string>)[hospital.type] || hospital.type}</span></div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground shrink-0" /><span className="truncate">{locHospital.district.name}</span></div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground shrink-0" /><span>{hospital.contact_phone}</span></div>
            </div>
            <div className="mt-4"><div className="flex flex-wrap gap-1.5">{locHospital.departments.slice(0, 3).map((dept) => (<span key={dept} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{dept}</span>))}{locHospital.departments.length > 3 && (<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">+{locHospital.departments.length - 3} {t.common.more}</span>)}</div></div>
          </Link>
          );
        })}
      </div>
    </div>
  );
}

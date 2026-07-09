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
        {hospitals.map((hospital) => {
          const locHospital = localizeHospitalWithDistrict(hospital, language);
          return (
          <Link key={hospital.id} href={`/hospitals/${hospital.id}`} className="group rounded-2xl bg-white border border-[#e5e7eb] p-7 hover:border-[#2563eb]/30 hover:shadow-md transition-all">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dbeafe] text-[#2563eb] shrink-0"><Building2 className="h-6 w-6" /></div>
              <div className="min-w-0"><h2 className="font-semibold text-[#0f172a] group-hover:text-[#2563eb] transition-colors">{locHospital.name}</h2><span className="mt-1 inline-block rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[12px] font-semibold text-[#475569] capitalize">{(t.hospitals.filters as Record<string, string>)[hospital.type] || hospital.type}</span></div>
            </div>
            <div className="mt-4 space-y-2 text-[14px] text-[#64748b]">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#94a3b8] shrink-0" /><span className="truncate">{locHospital.district.name}</span></div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#94a3b8] shrink-0" /><span>{hospital.contact_phone}</span></div>
            </div>
            <div className="mt-4"><div className="flex flex-wrap gap-1.5">{locHospital.departments.slice(0, 3).map((dept) => (<span key={dept} className="rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-[12px] font-medium text-[#2563eb]">{dept}</span>))}{locHospital.departments.length > 3 && (<span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[12px] text-[#64748b]">+{locHospital.departments.length - 3} {t.common.more}</span>)}</div></div>
          </Link>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { getAllSpecialties } from "@/services/data";
import { HeartPulse, Brain, ScanFace, Bone, Stethoscope, BrainCog, Ear, Baby, Ribbon, Wind, Droplets, Eye, Activity, Scissors } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { localizeSpecialty } from "@/lib/localize";

const iconMap: Record<string, React.ReactNode> = {
  "heart-pulse": <HeartPulse className="h-8 w-8" />, "brain": <Brain className="h-8 w-8" />,
  "scan-face": <ScanFace className="h-8 w-8" />, "bone": <Bone className="h-8 w-8" />,
  "stethoscope": <Stethoscope className="h-8 w-8" />, "brain-cog": <BrainCog className="h-8 w-8" />,
  "ear": <Ear className="h-8 w-8" />, "baby": <Baby className="h-8 w-8" />,
  "ribbon": <Ribbon className="h-8 w-8" />, "wind": <Wind className="h-8 w-8" />,
  "droplets": <Droplets className="h-8 w-8" />, "eye": <Eye className="h-8 w-8" />,
  "activity": <Activity className="h-8 w-8" />, "scissors": <Scissors className="h-8 w-8" />,
};

export default function SpecialtiesPage() {
  const specialties = getAllSpecialties();
  const { t, language } = useLanguage();

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
      <div className="mb-8">
        <h1
          className="text-[24px] font-semibold text-[#0f172a] sm:text-[36px] md:text-[44px] tracking-[-0.374px]"
          style={{ fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif' }}
        >
          {t.specialties.title}
        </h1>
        <p className="mt-3 text-[15px] sm:text-[18px] text-[#64748b]">{t.specialties.subtitle.replace("{count}", specialties.length.toString())}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {specialties.map((s) => {
          const locSpec = localizeSpecialty(s, language);
          return (
          <Link key={s.id} href={`/specialties/${s.slug}`} className="group rounded-2xl bg-white border border-[#e5e7eb] p-7 hover:border-[#2563eb]/30 hover:shadow-md transition-all">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#dbeafe] text-[#2563eb] group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
              {iconMap[s.icon || "stethoscope"] || <Stethoscope className="h-8 w-8" />}
            </div>
            <h2 className="mt-5 text-[18px] font-semibold text-[#0f172a] group-hover:text-[#2563eb] transition-colors">{locSpec.name}</h2>
            <p className="mt-2.5 text-[17px] text-[#64748b] leading-relaxed">{locSpec.description}</p>
          </Link>
          );
        })}
      </div>
    </div>
  );
}

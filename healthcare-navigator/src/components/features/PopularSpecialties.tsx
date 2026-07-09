"use client";

import Link from "next/link";
import { getAllSpecialties } from "@/services/data";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { localizeSpecialty } from "@/lib/localize";
import {
  HeartPulse, Brain, ScanFace, Bone, Stethoscope, BrainCog,
  Ear, Baby, Ribbon, Wind, Droplets, Eye, Activity, Scissors,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  "heart-pulse": <HeartPulse className="h-6 w-6" />,
  "brain": <Brain className="h-6 w-6" />,
  "scan-face": <ScanFace className="h-6 w-6" />,
  "bone": <Bone className="h-6 w-6" />,
  "stethoscope": <Stethoscope className="h-6 w-6" />,
  "brain-cog": <BrainCog className="h-6 w-6" />,
  "ear": <Ear className="h-6 w-6" />,
  "baby": <Baby className="h-6 w-6" />,
  "ribbon": <Ribbon className="h-6 w-6" />,
  "wind": <Wind className="h-6 w-6" />,
  "droplets": <Droplets className="h-6 w-6" />,
  "eye": <Eye className="h-6 w-6" />,
  "activity": <Activity className="h-6 w-6" />,
  "scissors": <Scissors className="h-6 w-6" />,
};

export default function PopularSpecialties() {
  const { t, language } = useLanguage();
  const specialties = getAllSpecialties().slice(0, 8);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1440px] px-6 py-12 sm:py-24 lg:px-10">
        <div className="text-center">
          <h2 className="text-[24px] font-semibold sm:text-[36px] md:text-[44px] tracking-[-0.374px]" style={{ color: "#111827" }}>
            {t.home.popularSpecialties}
          </h2>
          <p className="mt-4 text-[15px] sm:text-[18px]" style={{ color: "#4B5563" }}>
            {t.home.browseSpecialties}
          </p>
        </div>

        <div className="mt-8 sm:mt-14 grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {specialties.map((s) => {
            const locSpec = localizeSpecialty(s, language);
            return (
            <Link
              key={s.id}
              href={`/specialties/${s.slug}`}
              className="group flex flex-col items-center rounded-2xl bg-white p-4 sm:p-7 transition-all hover:shadow-md"
              style={{ border: "1px solid #e5e7eb" }}
            >
              <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full transition-colors" style={{ backgroundColor: "#dbeafe", color: "#2563eb" }}>
                {iconMap[s.icon || "stethoscope"] || <Stethoscope className="h-6 w-6" />}
              </div>
              <h3 className="mt-4 text-[15px] font-semibold transition-colors" style={{ color: "#111827" }}>
                {locSpec.name}
              </h3>
              <p className="mt-1.5 text-[13px] text-center line-clamp-2" style={{ color: "#4B5563" }}>
                {locSpec.description.slice(0, 60)}...
              </p>
            </Link>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/specialties"
            className="inline-flex items-center gap-1.5 text-[17px] font-medium transition-colors"
            style={{ color: "#2563eb" }}
          >
            {t.common.viewAll} {t.nav.specialties}
          </Link>
        </div>
      </div>
    </section>
  );
}

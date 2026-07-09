"use client";

import HeroSearch from "@/components/features/HeroSearch";
import PopularSpecialties from "@/components/features/PopularSpecialties";
import FindDoctorsSection from "@/components/features/FindDoctorsSection";
import FindHospitalsSection from "@/components/features/FindHospitalsSection";
import { HeartPulse, Stethoscope, Search, Building2, ShieldCheck, MapPin, Users, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function HomePage() {
  const { t, language } = useLanguage();

  return (
    <>
      <HeroSearch />
      <PopularSpecialties />
      <FindDoctorsSection />

      {/* How it works */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-12 sm:py-24 lg:px-10">
          <div className="text-center">
            <h2 className="text-[24px] font-semibold sm:text-[36px] md:text-[44px] tracking-[-0.374px]" style={{ color: "#111827" }}>
              {t.home.howItWorks}
            </h2>
            <p className="mt-4 text-[15px] sm:text-[18px]" style={{ color: "#4B5563" }}>
              {t.home.howItWorksDesc}
            </p>
          </div>

          <div className="mt-10 sm:mt-16 grid grid-cols-1 gap-5 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <HeartPulse className="h-6 w-6" />, step: "1", title: t.home.step1Title, desc: t.home.step1Desc },
              { icon: <Search className="h-6 w-6" />, step: "2", title: t.home.step2Title, desc: t.home.step2Desc },
              { icon: <Users className="h-6 w-6" />, step: "3", title: t.home.step3Title, desc: t.home.step3Desc },
              { icon: <Building2 className="h-6 w-6" />, step: "4", title: t.home.step4Title, desc: t.home.step4Desc },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center rounded-2xl p-5 sm:p-7 transition-all hover:shadow-md" style={{ border: "1px solid #e5e7eb" }}>
                <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: "#dbeafe", color: "#2563eb" }}>
                  {item.icon}
                </div>
                <div className="mt-4 flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-bold" style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
                  {item.step}
                </div>
                <h3 className="mt-3 text-[18px] font-semibold" style={{ color: "#111827" }}>{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#4B5563" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FindHospitalsSection />

      {/* Trust section */}
      <section style={{ backgroundColor: "#f8fafc" }}>
        <div className="mx-auto max-w-[1440px] px-6 py-12 sm:py-24 lg:px-10">
          <div className="text-center">
            <h2 className="text-[24px] font-semibold sm:text-[36px] md:text-[44px] tracking-[-0.374px]" style={{ color: "#111827" }}>
              {t.home.whyUse}
            </h2>
            <p className="mt-4 text-[15px] sm:text-[18px]" style={{ color: "#4B5563" }}>
              {t.home.whyUseDesc}
            </p>
          </div>

          <div className="mt-8 sm:mt-14 grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <Stethoscope className="h-5 w-5" />, title: t.home.findBySpecialty, desc: t.home.findBySpecialtyDesc },
              { icon: <HeartPulse className="h-5 w-5" />, title: t.home.discoverFromSymptoms, desc: t.home.discoverFromSymptomsDesc },
              { icon: <Search className="h-5 w-5" />, title: t.home.compareAlternatives, desc: t.home.compareAlternativesDesc },
              { icon: <MapPin className="h-5 w-5" />, title: t.home.searchHospitals, desc: t.home.searchHospitalsDesc },
              { icon: <ShieldCheck className="h-5 w-5" />, title: t.home.designedForPublic, desc: t.home.designedForPublicDesc },
              { icon: <BadgeCheck className="h-5 w-5" />, title: t.home.freePlatform, desc: t.home.freePlatformDesc },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-2xl bg-white p-6 transition-all hover:shadow-md" style={{ border: "1px solid #e5e7eb" }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ backgroundColor: "#dbeafe", color: "#2563eb" }}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold" style={{ color: "#111827" }}>{item.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: "#4B5563" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

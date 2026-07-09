"use client";

import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer style={{ backgroundColor: "#0f172a" }}>
      <div className="mx-auto max-w-[1440px] px-6 py-10 sm:py-16 lg:px-10">
        <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center">
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-semibold" style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
                <Stethoscope className="h-4 w-4" />
                {t.common.appName}
              </span>
            </Link>
            <p className="mt-4 text-[14px] leading-relaxed" style={{ color: "#CBD5E1" }}>
              {t.footer.description}
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold" style={{ color: "#f9fafb" }}>{t.footer.quickLinks}</h3>
            <ul className="mt-3 space-y-2">
              {[
                { href: "/doctors", label: t.footer.findDoctors },
                { href: "/specialties", label: t.footer.specialties },
                { href: "/hospitals", label: t.footer.findHospitals },
                { href: "/symptom-assistant", label: t.footer.symptomChecker },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[14px] transition-colors" style={{ color: "#CBD5E1" }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold" style={{ color: "#f9fafb" }}>{t.footer.resources}</h3>
            <ul className="mt-3 space-y-2">
              {[
                { href: "/specialties/cardiologist", label: "Cardiologist" },
                { href: "/specialties/neurologist", label: "Neurologist" },
                { href: "/specialties/orthopedic-surgeon", label: "Orthopedic Surgeon" },
                { href: "/specialties/dermatologist", label: "Dermatologist" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[14px] transition-colors" style={{ color: "#CBD5E1" }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold" style={{ color: "#f9fafb" }}>{t.footer.medicalDisclaimer}</h3>
            <p className="mt-3 text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
              {t.footer.disclaimerText}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid #334155" }}>
          <p className="text-[13px]" style={{ color: "#94a3b8" }}>
            {t.footer.copyright}
          </p>
          <div className="flex items-center gap-4 text-[13px]" style={{ color: "#94a3b8" }}>
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Data Sources</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

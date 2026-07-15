"use client";

import Link from "next/link";
import { Stethoscope, Globe, Mail, Phone } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#0B1324]">
      <div className="mx-auto max-w-[1280px] px-6 py-10 sm:py-16 lg:px-12">
        <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#0066FF] px-4 py-1.5 text-sm font-semibold text-white">
                <Stethoscope className="h-4 w-4" />
                {t.common.appName}
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              {t.footer.description}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-[#0066FF] hover:text-white"
                aria-label="Visit our website"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="mailto:info@healthnav.bd"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-[#0066FF] hover:text-white"
                aria-label="Email us"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{t.footer.quickLinks}</h3>
            <ul className="mt-3 space-y-2">
              {[
                { href: "/doctors", label: t.footer.findDoctors },
                { href: "/specialties", label: t.footer.specialties },
                { href: "/hospitals", label: t.footer.findHospitals },
                { href: "/ai-symptom-checker", label: t.footer.symptomChecker },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/50 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{t.footer.resources}</h3>
            <ul className="mt-3 space-y-2">
              {[
                { href: "/specialties/cardiologist", label: t.specialties?.names?.cardiologist || "Cardiologist" },
                { href: "/specialties/neurologist", label: t.specialties?.names?.neurologist || "Neurologist" },
                { href: "/specialties/orthopedic-surgeon", label: t.specialties?.names?.["orthopedic-surgeon"] || "Orthopedic Surgeon" },
                { href: "/specialties/dermatologist", label: t.specialties?.names?.dermatologist || "Dermatologist" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/50 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{t.footer.medicalDisclaimer}</h3>
            <p className="mt-3 text-xs leading-relaxed text-white/40">
              {t.footer.disclaimerText}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/40">
            {t.footer.copyright}
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>Healthcare Navigator Bangladesh</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

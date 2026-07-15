"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Star, BadgeCheck, Clock } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { localizeSpecialty, localizeDoctorWithRelations } from "@/lib/localize";
import { doctors, specialties, hospitals, districts, doctorSpecialties, doctorHospitals } from "@/data/seed";
import { getInitials, getSpecialtyColor } from "@/lib/avatar-utils";

export default function SpecialtyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t, language } = useLanguage();

  let specialty: any = null;
  let doctorsList: any[] = [];
  try {
    specialty = specialties.find((s: any) => s.slug === slug);
    if (specialty) {
      doctorsList = doctorSpecialties.filter((ds: any) => ds.specialty_id === specialty.id).map((ds: any) => {
        const d = doctors.find((doc: any) => doc.id === ds.doctor_id);
        if (!d) return null;
        const specs = doctorSpecialties.filter((s2: any) => s2.doctor_id === d.id).map((s2: any) => specialties.find((sp: any) => sp.id === s2.specialty_id)).filter(Boolean);
        const hosps = doctorHospitals.filter((dh: any) => dh.doctor_id === d.id).map((dh: any) => {
          const h = hospitals.find((hp: any) => hp.id === dh.hospital_id);
          if (!h) return null;
          const dist = districts.find((di: any) => di.id === h.district_id);
          return { ...h, district: dist || { id: "", name: "Unknown", name_bn: "অজানা", division: "Unknown", division_bn: "অজানা" } };
        }).filter(Boolean);
        return { ...d, specialties: specs, hospitals: hosps };
      }).filter(Boolean);
    }
  } catch (e) {
    console.error("Failed to load specialty:", e);
  }

  const locSpecialty = specialty ? localizeSpecialty(specialty, language) : null;
  const locDoctorsList = doctorsList.map((d: any) => localizeDoctorWithRelations(d, language));

  if (!specialty || !locSpecialty) {
    return (<div className="mx-auto max-w-[1280px] px-6 py-16 text-center"><h1 className="text-[28px] font-bold text-[#1E293B]">{t.specialties.notFound}</h1><Link href="/specialties" className="mt-4 inline-block text-[#0066FF] hover:underline">{t.specialties.backToSpecialties}</Link></div>);
  }

  const specColor = getSpecialtyColor(locSpecialty.name);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-12 lg:px-12">
      <Link href="/specialties" className="inline-flex items-center gap-2 text-[14px] text-[#64748B] hover:text-[#0066FF] mb-6"><ArrowLeft className="h-4 w-4" /> {t.specialties.backToSpecialties}</Link>
      <div className="mb-8">
        <h1 className="text-[24px] sm:text-[36px] md:text-[44px] font-bold text-[#1E293B] tracking-[-0.01em]">{locSpecialty.name}</h1>
        <p className="mt-3 text-[15px] sm:text-[18px] text-[#64748B] max-w-3xl">{locSpecialty.description}</p>
        <p className="mt-3 text-[14px] text-[#0066FF] font-semibold">{t.specialties.doctorsAvailable.replace("{count}", locDoctorsList.length.toString())}</p>
      </div>
      {locDoctorsList.length === 0 ? (<div className="rounded-[12px] bg-white p-5 sm:p-12 text-center shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]"><p className="text-[16px] sm:text-[18px] text-[#64748B]">{t.specialties.detail.noDoctors}</p></div>) : (
        <div className="space-y-4">
          {locDoctorsList.map((doctor: any) => (
            <Link key={doctor.id} href={`/doctors/${doctor.id}`} className="group block rounded-[12px] bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0] transition-all hover:shadow-[0px_8px_30px_rgba(0,0,0,0.08)] hover:border-[#0066FF]/20">
              <div className="flex flex-col sm:flex-row gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-[21px] font-semibold shrink-0"
                  style={{ backgroundColor: specColor.bg, color: specColor.text }}
                >{getInitials(doctor.name)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <h3 className="font-semibold text-[#1E293B] group-hover:text-[#0066FF] transition-colors">{doctor.name}</h3>
                    <span className="text-[17px] font-semibold text-[#0066FF]">&#2547;{doctor.consultation_fee}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#94A3B8]">{t.doctors.profile.consultationFee}</p>
                  <p className="mt-1 text-[13px] text-[#64748B]">{doctor.qualifications}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-[#64748B]">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{doctor.hospitals[0]?.district?.name || "N/A"}</span>
                    <span className="flex items-center gap-1 text-[#0066FF] font-medium"><BadgeCheck className="h-3 w-3" />{doctor.experience_years}+ {t.doctors.profile.years}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{doctor.available_days.length} {t.common.daysPerWeek}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

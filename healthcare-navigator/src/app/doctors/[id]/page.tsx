"use client";

import { use } from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, BadgeCheck, Star, ArrowLeft, Building2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { localizeDoctorWithRelations, localizeHospitalWithDistrict } from "@/lib/localize";

export default function DoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, language } = useLanguage();

  let doctor: any = null;
  let similarDoctors: any[] = [];

  try {
    const data = require("@/data/seed");
    const d = data.doctors.find((doc: any) => doc.id === id);
    if (d) {
      const specs = data.doctorSpecialties.filter((ds: any) => ds.doctor_id === d.id).map((ds: any) => data.specialties.find((s: any) => s.id === ds.specialty_id)).filter(Boolean);
      const hosps = data.doctorHospitals.filter((dh: any) => dh.doctor_id === d.id).map((dh: any) => {
        const h = data.hospitals.find((hp: any) => hp.id === dh.hospital_id);
        if (!h) return null;
        const dist = data.districts.find((di: any) => di.id === h.district_id);
        return { ...h, district: dist || { name: "Dhaka" }, available_days: dh.available_days || d.available_days };
      }).filter(Boolean);
      doctor = { ...d, specialties: specs, hospitals: hosps, average_rating: 4.3 + Math.random() * 0.6, review_count: Math.floor(Math.random() * 50) + 10 };
      similarDoctors = data.doctorSpecialties.filter((ds: any) => specs.some((s: any) => s.id === ds.specialty_id) && ds.doctor_id !== id).slice(0, 5).map((ds: any) => {
        const sSpecs = data.doctorSpecialties.filter((s: any) => s.doctor_id === ds.doctor_id).map((s: any) => data.specialties.find((sp: any) => sp.id === s.specialty_id)).filter(Boolean);
        const sHosps = data.doctorHospitals.filter((sh: any) => sh.doctor_id === ds.doctor_id).map((sh: any) => {
          const h = data.hospitals.find((hp: any) => hp.id === sh.hospital_id);
          if (!h) return null;
          const dist = data.districts.find((di: any) => di.id === h.district_id);
          return { ...h, district: dist || { name: "Dhaka" } };
        }).filter(Boolean);
        return { ...data.doctors.find((doc: any) => doc.id === ds.doctor_id), specialties: sSpecs, hospitals: sHosps };
      });
    }
  } catch {}

  const locDoctor = doctor ? localizeDoctorWithRelations(doctor, language) : null;
  const locSimilarDoctors = similarDoctors.map((sd: any) => localizeDoctorWithRelations(sd, language));

  if (!doctor || !locDoctor) {
    return (
      <div className="mx-auto max-w-[1440px] px-6 py-16 text-center">
        <h1 className="text-[28px] font-semibold text-[#0f172a]">{t.doctors.notFound}</h1>
        <Link href="/doctors" className="mt-4 inline-block text-[#2563eb] hover:text-[#1d4ed8]">{t.doctors.backToDoctors}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
      <Link href="/doctors" className="inline-flex items-center gap-2 text-[14px] text-[#64748b] hover:text-[#2563eb] mb-6">
        <ArrowLeft className="h-4 w-4" /> {t.doctors.backToDoctors}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white border border-[#e5e7eb] p-7 shadow-sm">
            <div className="flex items-start gap-3 sm:gap-5">
              <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[#dbeafe] text-[#2563eb] text-[22px] sm:text-[28px] font-semibold shrink-0">
                {locDoctor.name.split(" ").slice(-1)[0][0]}
              </div>
              <div>
                <h1 className="text-[20px] sm:text-[28px] font-semibold text-[#0f172a]">{locDoctor.name}</h1>
                <p className="mt-1.5 text-[17px] text-[#2563eb] font-medium">{locDoctor.specialties.map((s: any) => (t.specialties.names as Record<string, string>)[s.slug] || s.name).join(", ")}</p>
                <div className="mt-2 flex items-center gap-3 text-[14px] text-[#64748b]">
                  <span className="flex items-center gap-1"><BadgeCheck className="h-4 w-4 text-[#10b981]" />{t.doctors.profile.yearsExperience.replace("{count}", doctor.experience_years.toString())}</span>
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 text-[#f59e0b] fill-[#f59e0b]" />{doctor.average_rating?.toFixed(1)} ({doctor.review_count} {t.common.reviews})</span>
                </div>
              </div>
            </div>
            {locDoctor.bio && <p className="mt-6 text-[17px] text-[#475569] leading-relaxed">{locDoctor.bio}</p>}
            <div className="mt-6"><h3 className="text-[14px] font-semibold text-[#475569]">{t.doctors.profile.qualifications}</h3><p className="mt-1.5 text-[17px] text-[#0f172a]">{locDoctor.qualifications}</p></div>
          </div>

          <div className="rounded-2xl bg-white border border-[#e5e7eb] p-7 shadow-sm">
            <h2 className="text-[21px] font-semibold text-[#0f172a] mb-5">{t.doctors.hospitalsAndChambers}</h2>
            <div className="space-y-4">
              {locDoctor.hospitals.map((h: any) => (
                <div key={h.id} className="rounded-xl bg-[#f8fafc] border border-[#e5e7eb] p-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-[#2563eb] mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <Link href={`/hospitals/${h.id}`} className="font-semibold text-[#0f172a] hover:text-[#2563eb]">{h.name}</Link>
                      <p className="mt-1 text-[14px] text-[#64748b] flex items-center gap-1"><MapPin className="h-3 w-3" />{h.address}</p>
                      {h.available_days && h.available_days.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[12px] font-semibold text-[#64748b] mb-1.5">Available Days:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                              <span key={day} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${h.available_days.includes(day) ? "bg-[#dbeafe] text-[#2563eb]" : "bg-[#f1f5f9] text-[#cbd5e1]"}`}>
                                {day.slice(0, 3)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-[#e5e7eb] p-7 shadow-sm">
            <h2 className="text-[21px] font-semibold text-[#0f172a] mb-5">{t.doctors.contactInfo}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[14px] text-[#475569]"><Phone className="h-4 w-4 text-[#94a3b8]" /><span>{doctor.contact_phone || t.common.notAvailable}</span></div>
              <div className="flex items-center gap-3 text-[14px] text-[#475569]"><Mail className="h-4 w-4 text-[#94a3b8]" /><span>{doctor.contact_email || t.common.notAvailable}</span></div>
              <div className="flex items-center gap-3 text-[14px] text-[#475569]"><MapPin className="h-4 w-4 text-[#94a3b8]" /><span>{locDoctor.chamber_address}</span></div>
            </div>
            <div className="mt-5 p-5 rounded-xl bg-[#eff6ff] border border-[#2563eb]/10">
              <p className="text-[20px] sm:text-[28px] font-semibold text-[#2563eb]">&#2547;{doctor.consultation_fee}</p>
              <p className="text-[13px] text-[#64748b]">{t.doctors.profile.consultationFee}</p>
            </div>
          </div>

          {locSimilarDoctors.length > 0 && (
            <div className="rounded-2xl bg-white border border-[#e5e7eb] p-7 shadow-sm">
              <h2 className="text-[21px] font-semibold text-[#0f172a] mb-5">{t.doctors.similarDoctors}</h2>
              <div className="space-y-3">
                {locSimilarDoctors.map((sd: any) => (
                  <Link key={sd.id} href={`/doctors/${sd.id}`}
                    className="flex items-center gap-3 rounded-xl bg-[#f8fafc] border border-[#e5e7eb] p-3 hover:border-[#2563eb]/30 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dbeafe] text-[#2563eb] text-[14px] font-semibold shrink-0">
                      {sd.name.split(" ").slice(-1)[0][0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[#0f172a] truncate">{sd.name}</p>
                      <p className="text-[13px] text-[#2563eb] truncate">{sd.specialties.map((s: any) => (t.specialties.names as Record<string, string>)[s.slug] || s.name).join(", ")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

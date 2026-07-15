"use client";

import { use } from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, BadgeCheck, Star, ArrowLeft, Building2, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { localizeDoctorWithRelations, localizeHospitalWithDistrict } from "@/lib/localize";
import { doctors, specialties, hospitals, districts, doctorSpecialties, doctorHospitals } from "@/data/seed";
import { getInitials, getSpecialtyColor } from "@/lib/avatar-utils";

const DAY_KEYS = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const DAY_LABELS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function DoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, language } = useLanguage();

  let doctor: any = null;
  let similarDoctors: any[] = [];

  try {
    const d = doctors.find((doc: any) => doc.id === id);
    if (d) {
      const specs = doctorSpecialties.filter((ds: any) => ds.doctor_id === d.id).map((ds: any) => specialties.find((s: any) => s.id === ds.specialty_id)).filter(Boolean);
      const hosps = doctorHospitals.filter((dh: any) => dh.doctor_id === d.id).map((dh: any) => {
        const h = hospitals.find((hp: any) => hp.id === dh.hospital_id);
        if (!h) return null;
        const dist = districts.find((di: any) => di.id === h.district_id);
        return { ...h, district: dist || { name: "Dhaka" }, available_days: dh.available_days || d.available_days };
      }).filter(Boolean);
      const ratingBase = parseInt(d.id) || 1;
      doctor = { ...d, specialties: specs, hospitals: hosps, average_rating: 4.0 + (ratingBase % 10) / 10, review_count: (ratingBase * 7) % 50 + 10 };
      similarDoctors = doctorSpecialties.filter((ds: any) => specs.some((s: any) => s.id === ds.specialty_id) && ds.doctor_id !== id).slice(0, 5).map((ds: any) => {
        const sSpecs = doctorSpecialties.filter((s: any) => s.doctor_id === ds.doctor_id).map((s: any) => specialties.find((sp: any) => sp.id === s.specialty_id)).filter(Boolean);
        const sHosps = doctorHospitals.filter((sh: any) => sh.doctor_id === ds.doctor_id).map((sh: any) => {
          const h = hospitals.find((hp: any) => hp.id === sh.hospital_id);
          if (!h) return null;
          const dist = districts.find((di: any) => di.id === h.district_id);
          return { ...h, district: dist || { name: "Dhaka" } };
        }).filter(Boolean);
        return { ...doctors.find((doc: any) => doc.id === ds.doctor_id), specialties: sSpecs, hospitals: sHosps };
      });
    }
  } catch (e) {
    console.error("Failed to load doctor:", e);
  }

  const locDoctor = doctor ? localizeDoctorWithRelations(doctor, language) : null;
  const locSimilarDoctors = similarDoctors.map((sd: any) => localizeDoctorWithRelations(sd, language));

  if (!doctor || !locDoctor) {
    return (
      <div className="mx-auto max-w-[1280px] px-6 py-16 text-center">
        <h1 className="text-[28px] font-bold text-[#1E293B]">{t.doctors.notFound}</h1>
        <Link href="/doctors" className="mt-4 inline-block text-[#0066FF] hover:underline">{t.doctors.backToDoctors}</Link>
      </div>
    );
  }

  const primarySpecName = locDoctor.specialties[0]?.name || "";
  const avatarColors = getSpecialtyColor(primarySpecName);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-12 lg:px-12">
      <Link href="/doctors" className="inline-flex items-center gap-2 text-[14px] text-[#64748B] hover:text-[#0066FF] mb-6">
        <ArrowLeft className="h-4 w-4" /> {t.doctors.backToDoctors}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[12px] bg-white p-7 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
            <div className="flex items-start gap-3 sm:gap-5">
              <div
                className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full text-[22px] sm:text-[28px] font-semibold shrink-0"
                style={{ backgroundColor: avatarColors.bg, color: avatarColors.text }}
              >
                {getInitials(locDoctor.name)}
              </div>
              <div>
                <h1 className="text-[20px] sm:text-[28px] font-bold text-[#1E293B]">{locDoctor.name}</h1>
                <p className="mt-1.5 text-[17px] text-[#0066FF] font-medium">{locDoctor.specialties.map((s: any) => (t.specialties.names as Record<string, string>)[s.slug] || s.name).join(", ")}</p>
                <div className="mt-2 flex items-center gap-3 text-[14px] text-[#64748B]">
                  <span className="flex items-center gap-1"><BadgeCheck className="h-4 w-4 text-[#2DD4BF]" />{t.doctors.profile.yearsExperience.replace("{count}", doctor.experience_years.toString())}</span>
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 text-[#F59E0B] fill-[#F59E0B]" />{doctor.average_rating?.toFixed(1)} ({doctor.review_count} {t.common.reviews})</span>
                </div>
              </div>
            </div>
            {locDoctor.bio && <p className="mt-6 text-[17px] text-[#475569] leading-relaxed">{locDoctor.bio}</p>}
            <div className="mt-6"><h3 className="text-[14px] font-semibold text-[#475569]">{t.doctors.profile.qualifications}</h3><p className="mt-1.5 text-[17px] text-[#0B1324]">{locDoctor.qualifications}</p></div>
          </div>

          <div className="rounded-[12px] bg-white p-7 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
            <h2 className="text-[21px] font-bold text-[#1E293B] mb-5">{t.doctors.hospitalsAndChambers}</h2>
            <div className="space-y-4">
              {locDoctor.hospitals.map((h: any) => (
                <div key={h.id} className="rounded-[8px] bg-[#F8FAFC] p-4 border border-[#E2E8F0]">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-[#0066FF] mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <Link href={`/hospitals/${h.id}`} className="font-semibold text-[#1E293B] hover:text-[#0066FF]">{h.name}</Link>
                      <p className="mt-1 text-[14px] text-[#64748B] flex items-center gap-1"><MapPin className="h-3 w-3" />{h.address}</p>
                      {h.available_days && h.available_days.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[12px] font-semibold text-[#64748B] mb-1.5">{t.doctors.profile.availableDays}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {DAY_LABELS.map((day, i) => (
                              <span key={day} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${h.available_days.includes(day) ? "ds-chip-blue" : "bg-[#F1F5F9] text-[#CBD5E1]"}`}>
                                {(t.doctors.days as Record<string, string>)[DAY_KEYS[i]] || day.slice(0, 3)}
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
          <div className="rounded-[12px] bg-white p-7 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
            <h2 className="text-[21px] font-bold text-[#1E293B] mb-5">{t.doctors.contactInfo}</h2>
            <div className="space-y-3">
              {doctor.contact_phone ? (
                <a
                  href={`tel:${doctor.contact_phone.replace(/\s+/g, "")}`}
                  className="flex items-center gap-3 text-[14px] text-[#475569] hover:text-[#0066FF] transition-colors p-2 -mx-2 rounded-[8px] hover:bg-[#F8FAFC] min-h-[44px]"
                  aria-label={`Call ${doctor.contact_phone}`}
                >
                  <Phone className="h-4 w-4 text-[#0066FF]" />
                  <span className="font-medium">{doctor.contact_phone}</span>
                </a>
              ) : (
                <div className="flex items-center gap-3 text-[14px] text-[#94A3B8] p-2 -mx-2">
                  <Phone className="h-4 w-4" />
                  <span>{t.common.notAvailable}</span>
                </div>
              )}

              {doctor.contact_email ? (
                <a
                  href={`mailto:${doctor.contact_email}`}
                  className="flex items-center gap-3 text-[14px] text-[#475569] hover:text-[#0066FF] transition-colors p-2 -mx-2 rounded-[8px] hover:bg-[#F8FAFC] min-h-[44px]"
                  aria-label={`Email ${doctor.contact_email}`}
                >
                  <Mail className="h-4 w-4 text-[#0066FF]" />
                  <span className="font-medium">{doctor.contact_email}</span>
                </a>
              ) : (
                <div className="flex items-center gap-3 text-[14px] text-[#94A3B8] p-2 -mx-2">
                  <Mail className="h-4 w-4" />
                  <span>{t.common.notAvailable}</span>
                </div>
              )}

              {locDoctor.chamber_address ? (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(locDoctor.chamber_address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-[14px] text-[#475569] hover:text-[#0066FF] transition-colors p-2 -mx-2 rounded-[8px] hover:bg-[#F8FAFC] min-h-[44px]"
                  aria-label={`Open ${locDoctor.chamber_address} in Google Maps`}
                >
                  <MapPin className="h-4 w-4 text-[#0066FF]" />
                  <span className="font-medium">{locDoctor.chamber_address}</span>
                </a>
              ) : (
                <div className="flex items-center gap-3 text-[14px] text-[#94A3B8] p-2 -mx-2">
                  <MapPin className="h-4 w-4" />
                  <span>{t.common.notAvailable}</span>
                </div>
              )}
            </div>
            <div className="mt-5 p-5 rounded-[8px] bg-[#E8F0FF]">
              <p className="text-[20px] sm:text-[28px] font-bold text-[#0066FF]">&#2547;{doctor.consultation_fee}</p>
              <p className="text-[13px] text-[#64748B]">{t.doctors.profile.consultationFee}</p>
            </div>
          </div>

          {locSimilarDoctors.length > 0 && (
            <div className="rounded-[12px] bg-white p-7 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
              <h2 className="text-[21px] font-bold text-[#1E293B] mb-5">{t.doctors.similarDoctors}</h2>
              <div className="space-y-3">
                {locSimilarDoctors.map((sd: any) => {
                  const sdSpecName = sd.specialties[0]?.name || "";
                  const sdColors = getSpecialtyColor(sdSpecName);
                  return (
                    <Link key={sd.id} href={`/doctors/${sd.id}`}
                      className="flex items-center gap-3 rounded-[8px] bg-[#F8FAFC] p-3 hover:bg-[#F1F5F9] transition-colors group border border-[#E2E8F0]">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold shrink-0"
                        style={{ backgroundColor: sdColors.bg, color: sdColors.text }}
                      >
                        {getInitials(sd.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-[#1E293B] truncate">{sd.name}</p>
                        <p className="text-[13px] text-[#0066FF] truncate">{sd.specialties.map((s: any) => (t.specialties.names as Record<string, string>)[s.slug] || s.name).join(", ")}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#CBD5E1] group-hover:text-[#64748B] transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

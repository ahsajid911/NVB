"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Building2, ExternalLink, Navigation, ChevronRight, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { localizeHospitalWithDistrict, localizeDoctorWithRelations } from "@/lib/localize";
import { doctors, specialties, hospitals, districts, doctorSpecialties, doctorHospitals } from "@/data/seed";
import { getInitials, getSpecialtyColor } from "@/lib/avatar-utils";

const HospitalMap = dynamic(() => import("@/components/features/HospitalMap"), { ssr: false });

const DEPT_VISIBLE_MAX = 6;

export default function HospitalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, language } = useLanguage();
  const [showAllDepts, setShowAllDepts] = useState(false);

  let hospital: any = null;
  let doctorsList: any[] = [];
  try {
    const h = hospitals.find((hp: any) => hp.id === id);
    if (h) {
      const dist = districts.find((d: any) => d.id === h.district_id);
      hospital = { ...h, district: dist || { name: "Unknown" } };
      doctorsList = doctorHospitals.filter((dh: any) => dh.hospital_id === id).map((dh: any) => {
        const d = doctors.find((doc: any) => doc.id === dh.doctor_id);
        if (!d) return null;
        const specs = doctorSpecialties.filter((s: any) => s.doctor_id === d.id).map((s: any) => specialties.find((sp: any) => sp.id === s.specialty_id)).filter(Boolean);
        return { ...d, specialties: specs, hospitals: [] };
      }).filter(Boolean);
    }
  } catch (e) {
    console.error("Failed to load hospital:", e);
  }

  const locHospital = hospital ? localizeHospitalWithDistrict(hospital, language) : null;
  const locDoctorsList = doctorsList.map((d: any) => localizeDoctorWithRelations(d, language));

  if (!hospital) {
    return (
      <div className="mx-auto max-w-[1280px] px-6 py-16 text-center">
        <h1 className="text-[28px] font-bold text-[#1E293B]">{t.hospitals.notFound}</h1>
        <Link href="/hospitals" className="mt-4 inline-block text-[#0066FF] hover:underline">{t.hospitals.backToHospitals}</Link>
      </div>
    );
  }

  const hasCoordinates = hospital.latitude && hospital.longitude;
  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locHospital!.name + ", " + locHospital!.address)}`;

  const visibleDepts = showAllDepts ? locHospital!.departments : locHospital!.departments.slice(0, DEPT_VISIBLE_MAX);
  const hasMoreDepts = locHospital!.departments.length > DEPT_VISIBLE_MAX;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-12 lg:px-12">
      <Link href="/hospitals" className="inline-flex items-center gap-2 text-[14px] mb-6 text-[#64748B] hover:text-[#0066FF]">
        <ArrowLeft className="h-4 w-4" /> {t.hospitals.backToHospitals}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Hospital header */}
          <div className="rounded-[12px] bg-white p-7 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[12px] shrink-0 bg-[#E8F0FF] text-[#0066FF]">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-[22px] sm:text-[28px] font-bold text-[#1E293B]">{locHospital!.name}</h1>
                <span className="mt-1 inline-block rounded-full px-3 py-1 text-[13px] font-semibold capitalize bg-[#F1F5F9] text-[#475569]">{t.hospitals.detail.typeHospital.replace("{type}", (t.hospitals.filters as any)[hospital.type === "semi-government" ? "semiGovernment" : hospital.type] || hospital.type)}</span>
              </div>
            </div>
          </div>

          {/* Departments */}
          <div className="rounded-[12px] bg-white p-7 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
            <h2 className="text-[21px] font-bold mb-5 text-[#1E293B]">{t.hospitals.detail.departments}</h2>
            <div className="flex flex-wrap gap-2">
              {visibleDepts.map((dept: string) => (
                <span key={dept} className="ds-chip-blue rounded-full px-3.5 py-1.5 text-[14px] font-medium">{(t.hospitals.departments as Record<string, string>)[dept] || dept}</span>
              ))}
              {hasMoreDepts && (
                <button
                  onClick={() => setShowAllDepts(!showAllDepts)}
                  className="inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-colors bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                >
                  {showAllDepts
                    ? t.common.showLess
                    : `+${locHospital!.departments.length - DEPT_VISIBLE_MAX} ${t.common.more}`}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAllDepts ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="rounded-[12px] bg-white p-7 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
            <h2 className="text-[21px] font-bold mb-5 text-[#1E293B]">{t.hospitals.detail.locationOnMap}</h2>
            {hasCoordinates ? (
              <HospitalMap latitude={hospital.latitude} longitude={hospital.longitude} hospitalName={locHospital!.name} address={locHospital!.address} />
            ) : (
              <div className="rounded-[8px] p-8 text-center bg-[#F8FAFC] border border-[#E2E8F0]">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-[#94A3B8]" />
                <p className="text-[15px] text-[#64748B]">{t.hospitals.detail.mapNotAvailable}</p>
                <p className="text-[13px] mt-1 text-[#94A3B8]">{t.hospitals.detail.addressDirections}</p>
              </div>
            )}
          </div>

          {/* Associated Doctors */}
          {doctorsList.length > 0 && (
            <div className="rounded-[12px] bg-white p-7 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
              <h2 className="text-[21px] font-bold mb-5 text-[#1E293B]">{t.hospitals.detail.associatedDoctors.replace("{count}", locDoctorsList.length.toString())}</h2>
              <div className="space-y-3">
                {locDoctorsList.map((doctor: any) => {
                  const primarySpec = doctor.specialties[0];
                  const specName = primarySpec?.name || "";
                  const colors = getSpecialtyColor(specName);
                  return (
                    <Link
                      key={doctor.id}
                      href={`/doctors/${doctor.id}`}
                      className="flex items-center gap-3 rounded-[8px] p-3 transition-colors hover:bg-[#F1F5F9] cursor-pointer group bg-[#F8FAFC] border border-[#E2E8F0]"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold shrink-0"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {getInitials(doctor.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-[#1E293B]">{doctor.name}</p>
                        <p className="text-[13px] text-[#0066FF]">{doctor.specialties.map((s: any) => (t.specialties.names as Record<string, string>)[s.slug] || s.name).join(", ")}</p>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">{t.doctors.profile.consultationFee}</p>
                      </div>
                      <span className="text-[14px] shrink-0 font-medium text-[#64748B]">&#2547;{doctor.consultation_fee}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#CBD5E1] group-hover:text-[#64748B] transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact & Location (merged) */}
          <div className="rounded-[12px] bg-white p-7 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
            <h2 className="text-[21px] font-bold mb-5 text-[#1E293B]">{t.hospitals.detail.contactInfo}</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-[14px] text-[#64748B]">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-[#94A3B8]" />
                <div>
                  <span>{locHospital!.address}</span>
                  <p className="text-[13px] text-[#94A3B8] mt-0.5">{t.hospitals.division.replace("{name}", locHospital!.district.name)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[14px] text-[#64748B]">
                <Phone className="h-4 w-4 shrink-0 text-[#94A3B8]" />
                <span>{hospital.contact_phone}</span>
              </div>
            </div>

            {hasCoordinates && (
              <p className="mt-4 text-[12px] font-mono text-[#94A3B8]">
                {hospital.latitude.toFixed(4)}, {hospital.longitude.toFixed(4)}
              </p>
            )}

            {hospital.website && (
              <a href={hospital.website} target="_blank" rel="noopener noreferrer"
                className="mt-5 flex items-center justify-center gap-2 w-full rounded-full px-5 py-3 text-[14px] font-semibold transition-colors bg-[#E8F0FF] text-[#0066FF] hover:bg-[#D6E4FF]">
                <ExternalLink className="h-4 w-4" />
                {t.hospitals.detail.visitWebsite}
              </a>
            )}

            {/* Google Maps button */}
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
              className="mt-3 ds-btn-primary w-full justify-center rounded-full px-5 py-3">
              <Navigation className="h-4 w-4" />
              {t.hospitals.detail.openInGoogleMaps}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

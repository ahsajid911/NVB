"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Building2, ExternalLink, Navigation } from "lucide-react";
import dynamic from "next/dynamic";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { localizeHospitalWithDistrict, localizeDoctorWithRelations } from "@/lib/localize";

const HospitalMap = dynamic(() => import("@/components/features/HospitalMap"), { ssr: false });

export default function HospitalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, language } = useLanguage();

  let hospital: any = null;
  let doctorsList: any[] = [];
  try {
    const data = require("@/data/seed");
    const h = data.hospitals.find((hp: any) => hp.id === id);
    if (h) {
      const dist = data.districts.find((d: any) => d.id === h.district_id);
      hospital = { ...h, district: dist || { name: "Unknown" } };
      doctorsList = data.doctorHospitals.filter((dh: any) => dh.hospital_id === id).map((dh: any) => {
        const d = data.doctors.find((doc: any) => doc.id === dh.doctor_id);
        if (!d) return null;
        const specs = data.doctorSpecialties.filter((s: any) => s.doctor_id === d.id).map((s: any) => data.specialties.find((sp: any) => sp.id === s.specialty_id)).filter(Boolean);
        return { ...d, specialties: specs, hospitals: [] };
      }).filter(Boolean);
    }
  } catch {}

  const locHospital = hospital ? localizeHospitalWithDistrict(hospital, language) : null;
  const locDoctorsList = doctorsList.map((d: any) => localizeDoctorWithRelations(d, language));

  if (!hospital) {
    return (
      <div className="mx-auto max-w-[1440px] px-6 py-16 text-center">
        <h1 className="text-[28px] font-semibold" style={{ color: "#111827" }}>{t.hospitals.notFound}</h1>
        <Link href="/hospitals" className="mt-4 inline-block" style={{ color: "#2563eb" }}>{t.hospitals.backToHospitals}</Link>
      </div>
    );
  }

  const hasCoordinates = hospital.latitude && hospital.longitude;
  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locHospital!.name + ", " + locHospital!.address)}`;

  const typeKey = `hospitals.filters.${hospital.type === "semi-government" ? "semiGovernment" : hospital.type}`;

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
      <Link href="/hospitals" className="inline-flex items-center gap-2 text-[14px] mb-6" style={{ color: "#6B7280" }}>
        <ArrowLeft className="h-4 w-4" /> {t.hospitals.backToHospitals}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Hospital header */}
          <div className="rounded-2xl bg-white p-7 shadow-sm" style={{ border: "1px solid #e5e7eb" }}>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl shrink-0" style={{ backgroundColor: "#dbeafe", color: "#2563eb" }}>
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-[22px] sm:text-[28px] font-semibold" style={{ color: "#111827" }}>{locHospital!.name}</h1>
                <span className="mt-1 inline-block rounded-full px-3 py-1 text-[13px] font-semibold capitalize" style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #e5e7eb" }}>{t.hospitals.detail.typeHospital.replace("{type}", (t.hospitals.filters as any)[hospital.type === "semi-government" ? "semiGovernment" : hospital.type] || hospital.type)}</span>
              </div>
            </div>
          </div>

          {/* Departments */}
          <div className="rounded-2xl bg-white p-7 shadow-sm" style={{ border: "1px solid #e5e7eb" }}>
            <h2 className="text-[21px] font-semibold mb-5" style={{ color: "#111827" }}>{t.hospitals.detail.departments}</h2>
            <div className="flex flex-wrap gap-2">
              {locHospital!.departments.map((dept: string) => (
                <span key={dept} className="rounded-full px-3.5 py-1.5 text-[14px] font-medium" style={{ backgroundColor: "#dbeafe", color: "#2563eb" }}>{(t.hospitals.departments as Record<string, string>)[dept] || dept}</span>
              ))}
            </div>
          </div>

          {/* Map */}
          <div className="rounded-2xl bg-white p-7 shadow-sm" style={{ border: "1px solid #e5e7eb" }}>
            <h2 className="text-[21px] font-semibold mb-5" style={{ color: "#111827" }}>{t.hospitals.detail.locationOnMap}</h2>
            {hasCoordinates ? (
              <HospitalMap latitude={hospital.latitude} longitude={hospital.longitude} hospitalName={locHospital!.name} />
            ) : (
              <div className="rounded-xl p-8 text-center" style={{ backgroundColor: "#f9fafb", border: "1px dashed #d1d5db" }}>
                <MapPin className="h-8 w-8 mx-auto mb-2" style={{ color: "#9CA3AF" }} />
                <p className="text-[15px]" style={{ color: "#6B7280" }}>{t.hospitals.detail.mapNotAvailable}</p>
                <p className="text-[13px] mt-1" style={{ color: "#9CA3AF" }}>{t.hospitals.detail.addressDirections}</p>
              </div>
            )}
          </div>

          {/* Associated Doctors */}
          {doctorsList.length > 0 && (
            <div className="rounded-2xl bg-white p-7 shadow-sm" style={{ border: "1px solid #e5e7eb" }}>
              <h2 className="text-[21px] font-semibold mb-5" style={{ color: "#111827" }}>{t.hospitals.detail.associatedDoctors.replace("{count}", locDoctorsList.length.toString())}</h2>
              <div className="space-y-3">
                {locDoctorsList.map((doctor: any) => (
                  <Link key={doctor.id} href={`/doctors/${doctor.id}`} className="flex items-center gap-3 rounded-xl p-3 transition-colors" style={{ backgroundColor: "#f8fafc", border: "1px solid #e5e7eb" }}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold shrink-0" style={{ backgroundColor: "#dbeafe", color: "#2563eb" }}>
                      {doctor.name.split(" ").slice(-1)[0][0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold" style={{ color: "#111827" }}>{doctor.name}</p>
                      <p className="text-[13px]" style={{ color: "#2563eb" }}>{doctor.specialties.map((s: any) => (t.specialties.names as Record<string, string>)[s.slug] || s.name).join(", ")}</p>
                    </div>
                    <span className="text-[14px] shrink-0 font-medium" style={{ color: "#4B5563" }}>&#2547;{doctor.consultation_fee}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="rounded-2xl bg-white p-7 shadow-sm" style={{ border: "1px solid #e5e7eb" }}>
            <h2 className="text-[21px] font-semibold mb-5" style={{ color: "#111827" }}>{t.hospitals.detail.contactInfo}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[14px]" style={{ color: "#4B5563" }}>
                <MapPin className="h-4 w-4 shrink-0" style={{ color: "#6B7280" }} />
                <span>{locHospital!.address}</span>
              </div>
              <div className="flex items-center gap-3 text-[14px]" style={{ color: "#4B5563" }}>
                <Phone className="h-4 w-4 shrink-0" style={{ color: "#6B7280" }} />
                <span>{hospital.contact_phone}</span>
              </div>
            </div>

            {hospital.website && (
              <a href={hospital.website} target="_blank" rel="noopener noreferrer"
                className="mt-5 flex items-center justify-center gap-2 w-full rounded-full px-5 py-3 text-[14px] font-semibold transition-colors"
                style={{ backgroundColor: "#dbeafe", color: "#2563eb" }}>
                <ExternalLink className="h-4 w-4" />
                {t.hospitals.detail.visitWebsite}
              </a>
            )}

            {/* Google Maps button */}
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full rounded-full px-5 py-3 text-[14px] font-semibold transition-colors"
              style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
              <Navigation className="h-4 w-4" />
              {t.hospitals.detail.openInGoogleMaps}
            </a>
          </div>

          {/* Location */}
          <div className="rounded-2xl bg-white p-7 shadow-sm" style={{ border: "1px solid #e5e7eb" }}>
            <h2 className="text-[21px] font-semibold mb-3" style={{ color: "#111827" }}>{t.hospitals.detail.location}</h2>
            <p className="text-[14px]" style={{ color: "#4B5563" }}>{t.hospitals.division.replace("{name}", locHospital!.district.name)}</p>
            <p className="mt-2 text-[13px]" style={{ color: "#6B7280" }}>{locHospital!.address}</p>
            {hasCoordinates && (
              <p className="mt-2 text-[12px] font-mono" style={{ color: "#9CA3AF" }}>
                {hospital.latitude.toFixed(4)}, {hospital.longitude.toFixed(4)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

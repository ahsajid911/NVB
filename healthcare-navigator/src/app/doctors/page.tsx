"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, MapPin, Clock, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { districts, specialties as specialtiesSeed, doctors as doctorsSeed, doctorSpecialties as dsSeed, doctorHospitals as dhSeed, hospitals as hospitalsSeed, districts as districtsSeed } from "@/data/seed";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { localizeDoctorWithRelations, localizeDistrict, searchMatchesBilingual } from "@/lib/localize";
import { getInitials, getSpecialtyColor } from "@/lib/avatar-utils";

function DoctorSearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { t, language } = useLanguage();

  const [query, setQuery] = useState(initialQuery);
  const [specialty, setSpecialty] = useState(searchParams.get("specialty") || "");
  const [district, setDistrict] = useState(searchParams.get("district") || "");
  const [gender, setGender] = useState(searchParams.get("gender") || "");
  const [maxFee, setMaxFee] = useState(searchParams.get("maxFee") || "");
  const [sortBy, setSortBy] = useState("name");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const allDoctors = useMemo(() => {
    return doctorsSeed.map((d) => {
      const specs = dsSeed.filter((ds) => ds.doctor_id === d.id).map((ds) => specialtiesSeed.find((s) => s.id === ds.specialty_id)).filter(Boolean);
      const hosps = dhSeed.filter((dh) => dh.doctor_id === d.id).map((dh) => {
        const h = hospitalsSeed.find((hp) => hp.id === dh.hospital_id);
        if (!h) return null;
        const dist = districtsSeed.find((di) => di.id === h.district_id);
        return { name: h.name, district: { name: dist?.name || "Dhaka" } };
      }).filter(Boolean);
      return { ...d, specialties: specs, hospitals: hosps };
    });
  }, []);

  const filtered = useMemo(() => {
    let results = allDoctors;
    if (query) {
      const q = query.toLowerCase();
      results = results.filter((d) =>
        d.name.toLowerCase().includes(q) ||
        (d as any).name_bn?.toLowerCase().includes(q) ||
        d.specialties.some((s: any) => s.name.toLowerCase().includes(q) || s.name_bn?.toLowerCase().includes(q)) ||
        d.hospitals.some((h: any) => h.name.toLowerCase().includes(q) || h.name_bn?.toLowerCase().includes(q) ||
        h.district.name.toLowerCase().includes(q) || h.district.name_bn?.toLowerCase().includes(q))
      );
    }
    if (specialty) results = results.filter((d) => d.specialties.some((s: any) => s.slug === specialty));
    if (district) results = results.filter((d) => d.hospitals.some((h: any) => h.district.name === district));
    if (gender) results = results.filter((d) => d.gender === gender);
    if (maxFee) results = results.filter((d) => d.consultation_fee <= parseInt(maxFee));

    results.sort((a, b) => {
      switch (sortBy) {
        case "experience": return b.experience_years - a.experience_years;
        case "fee": return a.consultation_fee - b.consultation_fee;
        default: return a.name.localeCompare(b.name);
      }
    });
    return results;
  }, [allDoctors, query, specialty, district, gender, maxFee, sortBy]);

  const perPage = 12;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-12 lg:px-12">
      <div className="mb-8">
        <h1 className="text-[24px] font-bold text-[#1E293B] sm:text-[36px] md:text-[44px] tracking-[-0.01em]">
          {t.doctors.title}
        </h1>
        <p className="mt-3 text-[15px] sm:text-[18px] text-[#64748B]">{t.doctors.subtitle.replace("{count}", allDoctors.length.toString())}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block lg:w-72 shrink-0`}>
          <div className="sticky top-20 space-y-5">
            <div>
              <label className="text-[13px] font-semibold text-[#475569]">{t.doctors.filters.specialty}</label>
              <select value={specialty} onChange={(e) => { setSpecialty(e.target.value); setPage(1); }}
                className="mt-1 w-full ds-input rounded-[8px]">
                <option value="">{t.doctors.filters.allSpecialties}</option>
                {specialtiesSeed.map((s) => <option key={s.id} value={s.slug}>{(t.specialties.names as Record<string, string>)[s.slug] || s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#475569]">{t.doctors.filters.district}</label>
              <select value={district} onChange={(e) => { setDistrict(e.target.value); setPage(1); }}
                className="mt-1 w-full ds-input rounded-[8px]">
                <option value="">{t.doctors.filters.allDistricts}</option>
                {districts.map((d) => <option key={d.id} value={d.name}>{localizeDistrict(d, language).name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#475569]">{t.doctors.filters.gender}</label>
              <select value={gender} onChange={(e) => { setGender(e.target.value); setPage(1); }}
                className="mt-1 w-full ds-input rounded-[8px]">
                <option value="">{t.common.any}</option>
                <option value="male">{t.doctors.filters.male}</option>
                <option value="female">{t.doctors.filters.female}</option>
              </select>
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#475569]">{t.doctors.filters.maxFee}</label>
              <input type="number" value={maxFee} onChange={(e) => { setMaxFee(e.target.value); setPage(1); }}
                placeholder={t.doctors.filters.feePlaceholder}
                className="mt-1 w-full ds-input rounded-[8px]" />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#475569]">{t.doctors.filters.sortBy}</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="mt-1 w-full ds-input rounded-[8px]">
                <option value="name">{t.doctors.filters.name}</option>
                <option value="experience">{t.doctors.filters.experience}</option>
                <option value="fee">{t.doctors.filters.feeLowToHigh}</option>
                <option value="rating">{t.doctors.filters.rating}</option>
              </select>
            </div>
            <button onClick={() => { setSpecialty(""); setDistrict(""); setGender(""); setMaxFee(""); setQuery(""); setSortBy("name"); setPage(1); }}
              className="w-full rounded-[8px] bg-[#F8FAFC] px-4 py-2 text-[14px] font-medium text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
              {t.doctors.filters.clearFilters}
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 ds-search-pill">
              <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder={t.doctors.searchPlaceholder}
                className="flex-1 bg-transparent px-4 py-3 text-[17px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none" />
              <button className="inline-flex items-center gap-2 rounded-full bg-[#0066FF] px-4 py-2.5 text-white hover:bg-[#0054D6] transition-colors">
                <Search className="h-4 w-4" />
              </button>
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] font-medium text-[#64748B] border border-[#E2E8F0] shadow-[0px_4px_20px_rgba(0,0,0,0.05)] hover:bg-[#F8FAFC]">
              <SlidersHorizontal className="h-4 w-4" /> {t.common.filters}
            </button>
          </div>

          <div className="text-[14px] text-[#64748B] mb-4">{t.doctors.results.replace("{count}", filtered.length.toString())}</div>

          {paged.length === 0 ? (
            <div className="rounded-[12px] bg-white p-5 sm:p-12 text-center shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
              <p className="text-[16px] sm:text-[18px] text-[#64748B]">{t.doctors.noDoctors}</p>
              <button onClick={() => { setQuery(""); setSpecialty(""); setDistrict(""); setGender(""); setMaxFee(""); }} className="mt-4 text-[#0066FF] hover:underline text-[14px]">{t.common.clearAllFilters}</button>
            </div>
          ) : (
            <div className="space-y-4">
              {paged.map((doctor) => {
                const locDoc = localizeDoctorWithRelations(doctor as any, language);
                const primarySpec = locDoc.specialties[0];
                const specName = primarySpec?.name || "";
                const colors = getSpecialtyColor(specName);
                return (
                <Link key={doctor.id} href={`/doctors/${doctor.id}`}
                  className="group block rounded-[12px] bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0] transition-all hover:shadow-[0px_8px_30px_rgba(0,0,0,0.08)] hover:border-[#0066FF]/20">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-full text-[21px] font-semibold shrink-0"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {getInitials(locDoc.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <h3 className="font-semibold text-[#1E293B] group-hover:text-[#0066FF] transition-colors">{locDoc.name}</h3>
                        <span className="text-[17px] font-semibold text-[#0066FF]">&#2547;{doctor.consultation_fee}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#94A3B8]">{t.doctors.profile.consultationFee}</p>
                      <p className="mt-1 text-[14px] text-[#0066FF]">{locDoc.specialties.map((s: any) => (t.specialties.names as Record<string, string>)[s.slug] || s.name).join(", ")}</p>
                      <p className="mt-1 text-[13px] text-[#64748B]">{locDoc.qualifications}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-[#64748B]">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{locDoc.hospitals[0]?.district?.name || "N/A"}</span>
                        <span>{t.doctors.profile.yearsExperience.replace("{count}", doctor.experience_years.toString())}</span>
                        <span className="flex items-center gap-1 text-[#0066FF] font-medium"><BadgeCheck className="h-3 w-3" />{doctor.experience_years}+ yrs</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t.doctors.profile.daysPerWeek.replace("{count}", doctor.available_days.length.toString())}</span>
                      </div>
                    </div>
                  </div>
                </Link>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`rounded-[8px] px-4 py-2 text-[14px] font-medium transition-colors ${p === page ? "bg-[#0066FF] text-white" : "bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8FAFC]"}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DoctorSearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1280px] px-6 py-12"><p className="text-[18px] text-[#64748B]">Loading...</p></div>}>
      <DoctorSearchContent />
    </Suspense>
  );
}

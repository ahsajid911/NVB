"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, Clock, Building2 } from "lucide-react";
import { districts, specialties as specialtiesSeed, doctors as doctorsSeed, doctorSpecialties as dsSeed, doctorHospitals as dhSeed, hospitals as hospitalsSeed, districts as districtsSeed } from "@/data/seed";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { localizeDoctorWithRelations, localizeDistrict, searchMatchesBilingual } from "@/lib/localize";

export default function FindDoctorsSection() {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [district, setDistrict] = useState("");
  const [gender, setGender] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

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

  const perPage = 6;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <section style={{ backgroundColor: "#f8fafc" }}>
      <div className="mx-auto max-w-[1440px] px-6 py-12 sm:py-24 lg:px-10">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-[24px] font-semibold sm:text-[36px] md:text-[44px] tracking-[-0.374px]" style={{ color: "#111827" }}>
            {t.doctors.title}
          </h2>
          <p className="mt-4 text-[15px] sm:text-[18px]" style={{ color: "#4B5563" }}>
            {t.doctors.subtitle.replace("{count}", allDoctors.length.toString())}
          </p>
        </div>

        <div className="mx-auto max-w-xl mb-10">
          <div className="flex items-center rounded-full bg-white px-2 py-1.5" style={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={t.doctors.searchPlaceholder}
              className="flex-1 bg-transparent px-5 py-3 text-[17px] focus:outline-none"
              style={{ color: "#111827" }}
            />
            <button className="inline-flex items-center gap-2 rounded-full px-5 py-3" style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:hidden mb-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-medium min-h-[44px]"
              style={{ border: "1px solid #e5e7eb", backgroundColor: "#ffffff", color: "#4B5563" }}>
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
              {showFilters ? "▲" : "▼"}
            </button>
          </div>
          <aside className={`${showFilters ? "block" : "hidden"} lg:block lg:w-64 shrink-0`}>
            <div className="sticky top-20 space-y-4 rounded-2xl bg-white p-5" style={{ border: "1px solid #e5e7eb" }}>
              <div>
                <label className="text-[13px] font-semibold" style={{ color: "#475569" }}>{t.doctors.filters.specialty}</label>
                <select value={specialty} onChange={(e) => { setSpecialty(e.target.value); setPage(1); }}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-[14px] focus:outline-none"
                  style={{ border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", color: "#111827" }}>
                  <option value="">{t.doctors.filters.allSpecialties}</option>
                  {specialtiesSeed.map((s) => <option key={s.id} value={s.slug}>{(t.specialties.names as Record<string, string>)[s.slug] || s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[13px] font-semibold" style={{ color: "#475569" }}>{t.doctors.filters.district}</label>
                <select value={district} onChange={(e) => { setDistrict(e.target.value); setPage(1); }}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-[14px] focus:outline-none"
                  style={{ border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", color: "#111827" }}>
                  <option value="">{t.doctors.filters.allDistricts}</option>
                  {districts.map((d) => <option key={d.id} value={d.name}>{localizeDistrict(d, language).name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[13px] font-semibold" style={{ color: "#475569" }}>{t.doctors.filters.gender}</label>
                <select value={gender} onChange={(e) => { setGender(e.target.value); setPage(1); }}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-[14px] focus:outline-none"
                  style={{ border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", color: "#111827" }}>
                  <option value="">{t.common.any}</option>
                  <option value="male">{t.doctors.filters.male}</option>
                  <option value="female">{t.doctors.filters.female}</option>
                </select>
              </div>
              <div>
                <label className="text-[13px] font-semibold" style={{ color: "#475569" }}>{t.doctors.filters.maxFee}</label>
                <input type="number" value={maxFee} onChange={(e) => { setMaxFee(e.target.value); setPage(1); }}
                  placeholder={t.doctors.filters.feePlaceholder}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-[14px] focus:outline-none"
                  style={{ border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", color: "#111827" }} />
              </div>
              <div>
                <label className="text-[13px] font-semibold" style={{ color: "#475569" }}>{t.doctors.filters.sortBy}</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-[14px] focus:outline-none"
                  style={{ border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", color: "#111827" }}>
                  <option value="name">{t.doctors.filters.name}</option>
                  <option value="experience">{t.doctors.filters.experience}</option>
                  <option value="fee">{t.doctors.filters.feeLowToHigh}</option>
                </select>
              </div>
              <button onClick={() => { setSpecialty(""); setDistrict(""); setGender(""); setMaxFee(""); setQuery(""); setSortBy("name"); setPage(1); }}
                className="w-full rounded-xl px-4 py-2 text-[14px] font-medium transition-colors"
                style={{ border: "1px solid #e5e7eb", backgroundColor: "#ffffff", color: "#4B5563" }}>
                {t.doctors.filters.clearFilters}
              </button>
            </div>
          </aside>

          <div className="flex-1">
            <div className="text-[14px] mb-4 font-medium" style={{ color: "#4B5563" }}>{t.doctors.results.replace("{count}", filtered.length.toString())}</div>

            {paged.length === 0 ? (
              <div className="rounded-2xl bg-white p-5 sm:p-6 text-center" style={{ border: "1px solid #e5e7eb" }}>
                <p className="text-[18px]" style={{ color: "#4B5563" }}>{t.doctors.noDoctors}</p>
                <button onClick={() => { setQuery(""); setSpecialty(""); setDistrict(""); setGender(""); setMaxFee(""); }} className="mt-4 text-[14px] font-medium" style={{ color: "#2563eb" }}>{t.common.clearAllFilters}</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paged.map((doctor) => {
                  const locDoc = localizeDoctorWithRelations(doctor as any, language);
                  return (
                  <Link key={doctor.id} href={`/doctors/${doctor.id}`}
                    className="group rounded-2xl bg-white p-5 transition-all hover:shadow-md"
                    style={{ border: "1px solid #e5e7eb" }}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold shrink-0" style={{ backgroundColor: "#dbeafe", color: "#2563eb" }}>
                        {locDoc.name.split(" ").slice(-1)[0][0]}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate" style={{ color: "#111827" }}>{locDoc.name}</h3>
                        <p className="mt-1 text-[13px] font-medium" style={{ color: "#2563eb" }}>{locDoc.specialties.map((s: any) => (t.specialties.names as Record<string, string>)[s.slug] || s.name).join(", ")}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5 text-[13px]" style={{ color: "#4B5563" }}>
                      <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />{locDoc.hospitals[0]?.name || "N/A"}</div>
                      <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />{locDoc.hospitals[0]?.district?.name || "N/A"}</div>
                      <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />{t.doctors.profile.yearsExperience.replace("{count}", doctor.experience_years.toString())}</div>
                      <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid #f1f5f9" }}>
                        <span className="text-[12px]" style={{ color: "#6B7280" }}>{locDoc.qualifications}</span>
                        <span className="font-semibold" style={{ color: "#111827" }}>&#2547;{doctor.consultation_fee}</span>
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
                    className="rounded-xl px-4 py-2 text-[14px] font-medium transition-colors"
                    style={p === page ? { backgroundColor: "#2563eb", color: "#ffffff" } : { border: "1px solid #e5e7eb", color: "#4B5563" }}>
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 text-center">
              <Link href="/doctors" className="inline-flex items-center gap-1.5 text-[17px] font-medium transition-colors" style={{ color: "#2563eb" }}>
                {t.common.viewAll} {t.nav.findDoctors}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

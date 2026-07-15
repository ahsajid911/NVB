"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, Phone, Building2 } from "lucide-react";
import { districts, hospitals as hospitalsSeed, districts as districtsSeed } from "@/data/seed";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { localizeHospitalWithDistrict, localizeDistrict } from "@/lib/localize";

const hospitalTypes = [
  { value: "government", label: "Government" },
  { value: "private", label: "Private" },
  { value: "semi-government", label: "Semi-Government" },
  { value: "ngo", label: "NGO" },
];

const allDepartments = [...new Set(hospitalsSeed.flatMap((h) => h.departments))].sort();

export default function FindHospitalsSection() {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [type, setType] = useState("");
  const [department, setDepartment] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const allHospitals: Array<{id:string;name:string;district_id:string;type:string;address:string;contact_phone:string;contact_email:string|null;website:string|null;departments:string[];latitude:number|null;longitude:number|null;district:{name:string;id:string;division:string}}> = useMemo(() => {
    return hospitalsSeed.map((h) => {
      const dist = districtsSeed.find((d) => d.id === h.district_id);
      return { ...h, district: dist || { name: "Unknown", id: "0", division: "" } };
    });
  }, []);

  const filtered = useMemo(() => {
    let results = allHospitals;
    if (query) {
      const q = query.toLowerCase();
      results = results.filter((h) =>
        h.name.toLowerCase().includes(q) ||
        (h as any).name_bn?.toLowerCase().includes(q) ||
        h.district.name.toLowerCase().includes(q) ||
        (h.district as any).name_bn?.toLowerCase().includes(q) ||
        h.departments.some((d) => d.toLowerCase().includes(q)) ||
        ((h as any).departments_bn || []).some((d: string) => d.toLowerCase().includes(q))
      );
    }
    if (district) results = results.filter((h) => h.district.name === district);
    if (type) results = results.filter((h) => h.type === type);
    if (department) results = results.filter((h) => h.departments.includes(department));

    results.sort((a, b) => {
      switch (sortBy) {
        case "departments": return b.departments.length - a.departments.length;
        default: return a.name.localeCompare(b.name);
      }
    });
    return results;
  }, [allHospitals, query, district, type, department, sortBy]);

  const perPage = 6;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <section className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-[1280px] px-6 py-12 sm:py-24 lg:px-12">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-[24px] font-bold sm:text-[36px] md:text-[44px] tracking-[-0.01em] text-[#1E293B]">
            {t.hospitals.title}
          </h2>
          <p className="mt-4 text-[15px] sm:text-[18px] text-[#64748B]">
            {t.hospitals.subtitle.replace("{count}", allHospitals.length.toString())}
          </p>
        </div>

        <div className="mx-auto max-w-xl mb-10">
          <div className="ds-search-pill">
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={t.hospitals.searchPlaceholder}
              className="flex-1 bg-transparent py-3 text-[17px] focus:outline-none text-[#1E293B] placeholder:text-[#94A3B8]"
            />
            <button className="inline-flex items-center gap-2 rounded-full bg-[#0066FF] px-5 py-3 text-white hover:bg-[#0054D6] transition-colors">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:hidden mb-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-medium min-h-[44px] bg-white border border-[#E2E8F0] shadow-[0px_4px_20px_rgba(0,0,0,0.05)] text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
              {showFilters ? "▲" : "▼"}
            </button>
          </div>
          <aside className={`${showFilters ? "block" : "hidden"} lg:block lg:w-64 shrink-0`}>
            <div className="sticky top-20 space-y-4 rounded-[12px] bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">{t.hospitals.filters.district}</label>
                <select value={district} onChange={(e) => { setDistrict(e.target.value); setPage(1); }}
                  className="mt-1 w-full ds-input rounded-[8px]">
                  <option value="">{t.hospitals.filters.allDistricts}</option>
                  {districts.map((d) => <option key={d.id} value={d.name}>{localizeDistrict(d, language).name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">{t.hospitals.filters.type}</label>
                <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
                  className="mt-1 w-full ds-input rounded-[8px]">
                  <option value="">{t.hospitals.filters.allTypes}</option>
                  {hospitalTypes.map((ht) => {
                    const label = ht.value === "government" ? t.hospitals.filters.government
                      : ht.value === "private" ? t.hospitals.filters.private
                      : ht.value === "semi-government" ? t.hospitals.filters.semiGovernment
                      : ht.value === "ngo" ? t.hospitals.filters.ngo
                      : ht.label;
                    return <option key={ht.value} value={ht.value}>{label}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">{t.hospitals.filters.department}</label>
                <select value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                  className="mt-1 w-full ds-input rounded-[8px]">
                  <option value="">{t.hospitals.filters.allDepartments}</option>
                  {allDepartments.map((d) => <option key={d} value={d}>{(t.hospitals.departments as Record<string, string>)[d] || d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">{t.hospitals.filters.sortBy}</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="mt-1 w-full ds-input rounded-[8px]">
                  <option value="name">{t.hospitals.filters.name}</option>
                  <option value="departments">{t.hospitals.filters.mostDepartments}</option>
                </select>
              </div>
              <button onClick={() => { setDistrict(""); setType(""); setDepartment(""); setQuery(""); setSortBy("name"); setPage(1); }}
                className="w-full rounded-[8px] px-4 py-2 text-[14px] font-medium transition-colors bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B]">
                {t.hospitals.filters.clearFilters}
              </button>
            </div>
          </aside>

          <div className="flex-1">
            <div className="text-[14px] mb-4 font-medium text-[#64748B]">{t.hospitals.results.replace("{count}", filtered.length.toString())}</div>

            {paged.length === 0 ? (
              <div className="rounded-[12px] bg-white p-5 sm:p-6 text-center shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
                <p className="text-[18px] text-[#64748B]">{t.hospitals.noHospitals}</p>
                <button onClick={() => { setQuery(""); setDistrict(""); setType(""); setDepartment(""); }} className="mt-4 text-[14px] font-medium text-[#0066FF] hover:underline">{t.common.clearAllFilters}</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paged.map((hospital) => {
                  const locHospital = localizeHospitalWithDistrict(hospital as any, language);
                  return (
                  <Link key={hospital.id} href={`/hospitals/${hospital.id}`}
                    className="group rounded-[12px] bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0] transition-all hover:shadow-[0px_8px_30px_rgba(0,0,0,0.08)] hover:border-[#0066FF]/20">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[8px] shrink-0 bg-[#E8F0FF] text-[#0066FF]">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[#1E293B] group-hover:text-[#0066FF] transition-colors">{locHospital.name}</h3>
                        <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[12px] font-semibold capitalize bg-[#F1F5F9] text-[#475569]">{hospital.type === "government" ? t.hospitals.filters.government : hospital.type === "private" ? t.hospitals.filters.private : hospital.type === "semi-government" ? t.hospitals.filters.semiGovernment : hospital.type === "ngo" ? t.hospitals.filters.ngo : hospital.type}</span>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5 text-[13px] text-[#64748B]">
                      <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#94A3B8]" />{locHospital.district.name}</div>
                      <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-[#94A3B8]" />{hospital.contact_phone}</div>
                    </div>
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1.5">
                        {locHospital.departments.slice(0, 3).map((dept) => (
                          <span key={dept} className="ds-chip-blue rounded-full px-2.5 py-0.5 text-[12px] font-medium">{dept}</span>
                        ))}
                        {locHospital.departments.length > 3 && (
                          <span className="rounded-full px-2.5 py-0.5 text-[12px] bg-[#F1F5F9] text-[#64748B]">+{locHospital.departments.length - 3}</span>
                        )}
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

            <div className="mt-6 text-center">
              <Link href="/hospitals" className="ds-btn-ghost text-[17px]">
                {t.common.viewAll} {t.nav.hospitals}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

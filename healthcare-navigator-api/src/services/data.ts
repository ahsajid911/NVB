import { districts, specialties, hospitals, doctors, doctorSpecialties, doctorHospitals, symptomMappings } from "@/data/seed";
import type { Doctor, Specialty, Hospital, District, SymptomMapping, DoctorWithRelations, HospitalWithDistrict, SearchFilters, SearchResult, SymptomAnalysis } from "@/types/database";
import { localizeDoctorWithRelations, localizeHospitalWithDistrict, searchMatchesBilingual } from "@/lib/localize";

type Lang = "en" | "bn";

const allDistricts: District[] = districts;
const allSpecialties: Specialty[] = specialties;
const allHospitals: Hospital[] = hospitals;
const allDoctors: Doctor[] = doctors;
const allDoctorSpecialties: { doctor_id: string; specialty_id: string }[] = doctorSpecialties;
const allDoctorHospitals: { doctor_id: string; hospital_id: string }[] = doctorHospitals;
const allSymptomMappings: SymptomMapping[] = symptomMappings;

function getDoctorSpecialties(doctorId: string): Specialty[] {
  return allDoctorSpecialties
    .filter((ds) => ds.doctor_id === doctorId)
    .map((ds) => allSpecialties.find((s) => s.id === ds.specialty_id))
    .filter(Boolean) as Specialty[];
}

function getDoctorHospitals(doctorId: string): (Hospital & { district: District })[] {
  return allDoctorHospitals
    .filter((dh) => dh.doctor_id === doctorId)
    .map((dh) => {
      const hospital = allHospitals.find((h) => h.id === dh.hospital_id);
      if (!hospital) return null;
      const district = allDistricts.find((d) => d.id === hospital.district_id)!;
      return { ...hospital, district };
    })
    .filter(Boolean) as (Hospital & { district: District })[];
}

export function getDoctorWithRelations(doctorId: string): DoctorWithRelations | null {
  const doctor = allDoctors.find((d) => d.id === doctorId);
  if (!doctor) return null;
  return {
    ...doctor,
    specialties: getDoctorSpecialties(doctor.id),
    hospitals: getDoctorHospitals(doctor.id),
    average_rating: 4.0 + Math.random() * 0.9,
    review_count: Math.floor(Math.random() * 50) + 5,
  };
}

export function searchDoctors(filters: SearchFilters, lang: Lang = "en"): SearchResult<DoctorWithRelations> {
  let results = allDoctors.map((d) => getDoctorWithRelations(d.id)!).filter(Boolean);

  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter((d) => {
      const loc = localizeDoctorWithRelations(d, lang);
      const alt = lang === "en" ? localizeDoctorWithRelations(d, "bn") : localizeDoctorWithRelations(d, "en");
      return (
        loc.name.toLowerCase().includes(q) ||
        alt.name.toLowerCase().includes(q) ||
        d.specialties.some((s) => s.name.toLowerCase().includes(q) || s.name_bn.toLowerCase().includes(q)) ||
        d.hospitals.some((h) => h.name.toLowerCase().includes(q) || h.name_bn.toLowerCase().includes(q)) ||
        d.hospitals.some((h) => h.district.name.toLowerCase().includes(q) || h.district.name_bn.toLowerCase().includes(q))
      );
    });
  }

  if (filters.specialty) {
    const s = filters.specialty.toLowerCase();
    results = results.filter((d) => d.specialties.some((sp) => sp.slug === s || sp.name.toLowerCase().includes(s) || sp.name_bn.toLowerCase().includes(s)));
  }

  if (filters.hospital) {
    const h = filters.hospital.toLowerCase();
    results = results.filter((d) => d.hospitals.some((hp) => hp.name.toLowerCase().includes(h) || hp.name_bn.toLowerCase().includes(h)));
  }

  if (filters.district) {
    const dist = filters.district.toLowerCase();
    results = results.filter((d) => d.hospitals.some((h) => h.district.name.toLowerCase().includes(dist) || h.district.name_bn.toLowerCase().includes(dist)));
  }

  if (filters.gender) {
    results = results.filter((d) => d.gender === filters.gender);
  }

  if (filters.minExperience) {
    results = results.filter((d) => d.experience_years >= filters.minExperience!);
  }

  if (filters.maxFee) {
    results = results.filter((d) => d.consultation_fee <= filters.maxFee!);
  }

  if (filters.availableDay) {
    results = results.filter((d) => d.available_days.includes(filters.availableDay!));
  }

  const sortBy = filters.sortBy || "name";
  const sortOrder = filters.sortOrder || "asc";
  results.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "experience":
        cmp = a.experience_years - b.experience_years;
        break;
      case "fee":
        cmp = a.consultation_fee - b.consultation_fee;
        break;
      case "rating":
        cmp = (a.average_rating || 0) - (b.average_rating || 0);
        break;
    }
    return sortOrder === "desc" ? -cmp : cmp;
  });

  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const total = results.length;
  const totalPages = Math.ceil(total / limit);
  const data = results.slice((page - 1) * limit, page * limit);

  return { data, total, page, limit, totalPages };
}

export function getSpecialtyBySlug(slug: string): Specialty | undefined {
  return allSpecialties.find((s) => s.slug === slug);
}

export function getHospitalWithDistrict(hospitalId: string): HospitalWithDistrict | null {
  const hospital = allHospitals.find((h) => h.id === hospitalId);
  if (!hospital) return null;
  const district = allDistricts.find((d) => d.id === hospital.district_id)!;
  return { ...hospital, district };
}

export function getDoctorsByHospital(hospitalId: string): DoctorWithRelations[] {
  return allDoctorHospitals
    .filter((dh) => dh.hospital_id === hospitalId)
    .map((dh) => getDoctorWithRelations(dh.doctor_id))
    .filter(Boolean) as DoctorWithRelations[];
}

export function getDoctorsBySpecialty(specialtyId: string): DoctorWithRelations[] {
  return allDoctorSpecialties
    .filter((ds) => ds.specialty_id === specialtyId)
    .map((ds) => getDoctorWithRelations(ds.doctor_id))
    .filter(Boolean) as DoctorWithRelations[];
}

export function getSimilarDoctors(doctorId: string, limit = 5): DoctorWithRelations[] {
  const doctor = allDoctors.find((d) => d.id === doctorId);
  if (!doctor) return [];

  const docSpecialties = getDoctorSpecialties(doctorId);
  const docHospitals = getDoctorHospitals(doctorId);

  const scored = allDoctors
    .filter((d) => d.id !== doctorId)
    .map((d) => {
      let score = 0;
      const dSpecialties = getDoctorSpecialties(d.id);
      const dHospitals = getDoctorHospitals(d.id);

      if (dSpecialties.some((s) => docSpecialties.some((ds) => ds.id === s.id))) score += 3;
      if (dHospitals.some((h) => docHospitals.some((dh) => dh.id === h.id))) score += 2;
      if (Math.abs(d.experience_years - doctor.experience_years) <= 3) score += 1;
      if (d.gender === doctor.gender) score += 0.5;

      return { doctor: getDoctorWithRelations(d.id)!, score };
    })
    .filter((d) => d.doctor !== null)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.doctor);
}

export function analyzeSymptoms(input: string, lang: Lang = "en"): SymptomAnalysis {
  const lowerInput = input.toLowerCase();

  let bestMatch: SymptomMapping | null = null;
  let bestScore = 0;

  for (const mapping of allSymptomMappings) {
    let score = 0;
    const keywords = lang === "bn" ? mapping.symptom_keywords_bn : mapping.symptom_keywords;
    const altKeywords = lang === "en" ? mapping.symptom_keywords_bn : mapping.symptom_keywords;
    for (const keyword of [...keywords, ...altKeywords]) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        score += keyword.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = mapping;
    }
  }

  if (!bestMatch || bestScore === 0) {
    return {
      recommended: ["General Surgeon"],
      recommended_bn: ["জেনারেল সার্জন"],
      alternative: ["Pediatrician"],
      alternative_bn: ["শিশুরোগ বিশেষজ্ঞ"],
      disclaimer: "This information is not medical advice. Please consult a licensed healthcare professional.",
      disclaimer_bn: "এই তথ্য চিকিৎসা পরামর্শ নয়। অনুগ্রহ করে একজন লাইসেন্সপ্রাপ্ত স্বাস্থ্যসেবা পেশাদারের সাথে পরামর্শ করুন।",
    };
  }

  return {
    recommended: bestMatch.recommended_specialties,
    recommended_bn: bestMatch.recommended_specialties_bn,
    alternative: bestMatch.alternative_specialties,
    alternative_bn: bestMatch.alternative_specialties_bn,
    disclaimer: "This information is not medical advice. Please consult a licensed healthcare professional.",
    disclaimer_bn: "এই তথ্য চিকিৎসা পরামর্শ নয়। অনুগ্রহ করে একজন লাইসেন্সপ্রাপ্ত স্বাস্থ্যসেবা পেশাদারের সাথে পরামর্শ করুন।",
  };
}

export function getAllSpecialties(): Specialty[] {
  return allSpecialties;
}

export function getAllHospitals(): HospitalWithDistrict[] {
  return allHospitals.map((h) => ({
    ...h,
    district: allDistricts.find((d) => d.id === h.district_id)!,
  }));
}

export function getAllDistricts(): District[] {
  return allDistricts;
}

export function getFeaturedDoctors(): DoctorWithRelations[] {
  return allDoctors.slice(0, 8).map((d) => getDoctorWithRelations(d.id)!).filter(Boolean);
}

export function getFeaturedHospitals(): HospitalWithDistrict[] {
  return allHospitals.filter((h) => h.type === "private").slice(0, 6).map((h) => ({
    ...h,
    district: allDistricts.find((d) => d.id === h.district_id)!,
  }));
}

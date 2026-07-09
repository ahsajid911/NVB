import type { Doctor, Hospital, Specialty, District, DoctorWithRelations, HospitalWithDistrict, SymptomMapping } from "@/types/database";

type Lang = "en" | "bn";

export function localizeDistrict(district: District, lang: Lang): { name: string; division: string } {
  return {
    name: lang === "bn" ? district.name_bn : district.name,
    division: lang === "bn" ? district.division_bn : district.division,
  };
}

export function localizeSpecialty(specialty: Specialty, lang: Lang): { name: string; description: string } {
  return {
    name: lang === "bn" ? specialty.name_bn : specialty.name,
    description: lang === "bn" ? specialty.description_bn : specialty.description,
  };
}

export function localizeHospital(hospital: Hospital, lang: Lang): { name: string; address: string; departments: string[] } {
  return {
    name: lang === "bn" ? hospital.name_bn : hospital.name,
    address: lang === "bn" ? hospital.address_bn : hospital.address,
    departments: lang === "bn" ? hospital.departments_bn : hospital.departments,
  };
}

export function localizeDoctor(doctor: Doctor, lang: Lang): { name: string; qualifications: string; chamber_address: string; bio: string | null } {
  return {
    name: lang === "bn" ? doctor.name_bn : doctor.name,
    qualifications: lang === "bn" ? doctor.qualifications_bn : doctor.qualifications,
    chamber_address: lang === "bn" ? doctor.chamber_address_bn : doctor.chamber_address,
    bio: lang === "bn" ? doctor.bio_bn : doctor.bio,
  };
}

export function localizeDoctorWithRelations(dwr: DoctorWithRelations, lang: Lang): DoctorWithRelations {
  const loc = localizeDoctor(dwr, lang);
  return {
    ...dwr,
    name: loc.name,
    qualifications: loc.qualifications,
    chamber_address: loc.chamber_address,
    bio: loc.bio,
    specialties: dwr.specialties.map((s) => ({
      ...s,
      name: lang === "bn" ? s.name_bn : s.name,
      description: lang === "bn" ? s.description_bn : s.description,
    })),
    hospitals: (dwr.hospitals ?? []).map((h) => ({
      ...h,
      name: lang === "bn" ? h.name_bn : h.name,
      address: lang === "bn" ? h.address_bn : h.address,
      departments: lang === "bn" ? h.departments_bn : h.departments,
      district: {
        ...h.district,
        name: lang === "bn" ? h.district.name_bn : h.district.name,
        division: lang === "bn" ? h.district.division_bn : h.district.division,
      },
    })),
  };
}

export function localizeHospitalWithDistrict(hwd: HospitalWithDistrict, lang: Lang): HospitalWithDistrict {
  return {
    ...hwd,
    name: lang === "bn" ? hwd.name_bn : hwd.name,
    address: lang === "bn" ? hwd.address_bn : hwd.address,
    departments: lang === "bn" ? hwd.departments_bn : hwd.departments,
    district: {
      ...hwd.district,
      name: lang === "bn" ? hwd.district.name_bn : hwd.district.name,
      division: lang === "bn" ? hwd.district.division_bn : hwd.district.division,
    },
  };
}

export function searchMatchesBilingual(
  query: string,
  fields: string[],
  fieldsBn: string[]
): boolean {
  const q = query.toLowerCase();
  const enMatch = fields.some((f) => f.toLowerCase().includes(q));
  const bnMatch = fieldsBn.some((f) => f.toLowerCase().includes(q));
  return enMatch || bnMatch;
}

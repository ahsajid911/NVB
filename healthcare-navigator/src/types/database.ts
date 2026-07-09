export interface District {
  id: string;
  name: string;
  name_bn: string;
  division: string;
  division_bn: string;
}

export interface Specialty {
  id: string;
  name: string;
  name_bn: string;
  slug: string;
  description: string;
  description_bn: string;
  icon: string | null;
  created_at?: string;
}

export interface Hospital {
  id: string;
  name: string;
  name_bn: string;
  district_id: string;
  type: "government" | "private" | "semi-government" | "ngo";
  address: string;
  address_bn: string;
  contact_phone: string;
  contact_email: string | null;
  website: string | null;
  departments: string[];
  departments_bn: string[];
  latitude: number | null;
  longitude: number | null;
  created_at?: string;
}

export interface Doctor {
  id: string;
  name: string;
  name_bn: string;
  photo_url: string | null;
  qualifications: string;
  qualifications_bn: string;
  experience_years: number;
  consultation_fee: number;
  gender: "male" | "female" | "other";
  contact_phone: string | null;
  contact_email: string | null;
  chamber_address: string;
  chamber_address_bn: string;
  available_days: string[];
  bio: string | null;
  bio_bn: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DoctorSpecialty {
  doctor_id: string;
  specialty_id: string;
}

export interface DoctorHospital {
  doctor_id: string;
  hospital_id: string;
  available_days?: string[];
}

export interface SymptomMapping {
  id: string;
  symptom_keywords: string[];
  symptom_keywords_bn: string[];
  recommended_specialties: string[];
  recommended_specialties_bn: string[];
  alternative_specialties: string[];
  alternative_specialties_bn: string[];
  created_at?: string;
}

export interface Review {
  id: string;
  doctor_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at?: string;
}

export interface Import {
  id: string;
  type: "doctors" | "hospitals" | "specialties";
  filename: string;
  status: "pending" | "processing" | "completed" | "failed";
  rows_imported: number;
  rows_skipped: number;
  errors: string[];
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  role: "user" | "admin";
  created_at?: string;
}

export interface DoctorWithRelations extends Doctor {
  specialties: Specialty[];
  hospitals: (Hospital & { district: District })[];
  average_rating?: number;
  review_count?: number;
}

export interface HospitalWithDistrict extends Hospital {
  district: District;
}

export interface SearchFilters {
  query?: string;
  specialty?: string;
  hospital?: string;
  district?: string;
  gender?: string;
  minExperience?: number;
  maxFee?: number;
  availableDay?: string;
  sortBy?: "name" | "experience" | "fee" | "rating";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SymptomAnalysis {
  recommended: string[];
  recommended_bn: string[];
  alternative: string[];
  alternative_bn: string[];
  disclaimer: string;
  disclaimer_bn: string;
}

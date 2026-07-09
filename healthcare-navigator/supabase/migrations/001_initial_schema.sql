-- Healthcare Navigator Bangladesh Database Schema
-- Migration: 001_initial_schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Districts table
CREATE TABLE IF NOT EXISTS districts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  division TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Specialties table
CREATE TABLE IF NOT EXISTS specialties (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  district_id TEXT REFERENCES districts(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('government', 'private', 'semi-government', 'ngo')) NOT NULL DEFAULT 'private',
  address TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  website TEXT,
  departments TEXT[] DEFAULT '{}',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  photo_url TEXT,
  qualifications TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  consultation_fee INTEGER NOT NULL DEFAULT 0,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')) NOT NULL DEFAULT 'male',
  contact_phone TEXT,
  contact_email TEXT,
  chamber_address TEXT NOT NULL,
  available_days TEXT[] DEFAULT '{}',
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor-Specialty junction table
CREATE TABLE IF NOT EXISTS doctor_specialties (
  doctor_id TEXT REFERENCES doctors(id) ON DELETE CASCADE,
  specialty_id TEXT REFERENCES specialties(id) ON DELETE CASCADE,
  PRIMARY KEY (doctor_id, specialty_id)
);

-- Doctor-Hospital junction table
CREATE TABLE IF NOT EXISTS doctor_hospitals (
  doctor_id TEXT REFERENCES doctors(id) ON DELETE CASCADE,
  hospital_id TEXT REFERENCES hospitals(id) ON DELETE CASCADE,
  PRIMARY KEY (doctor_id, hospital_id)
);

-- Symptom mappings table
CREATE TABLE IF NOT EXISTS symptom_mappings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  symptom_keywords TEXT[] NOT NULL,
  recommended_specialties TEXT[] NOT NULL,
  alternative_specialties TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  doctor_id TEXT REFERENCES doctors(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Imports tracking table
CREATE TABLE IF NOT EXISTS imports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT CHECK (type IN ('doctors', 'hospitals', 'specialties')) NOT NULL,
  filename TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) NOT NULL DEFAULT 'pending',
  rows_imported INTEGER DEFAULT 0,
  rows_skipped INTEGER DEFAULT 0,
  errors TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (for admin)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  role TEXT CHECK (role IN ('user', 'admin')) NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctors_name ON doctors USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_doctors_gender ON doctors(gender);
CREATE INDEX IF NOT EXISTS idx_doctors_experience ON doctors(experience_years);
CREATE INDEX IF NOT EXISTS idx_doctors_fee ON doctors(consultation_fee);
CREATE INDEX IF NOT EXISTS idx_hospitals_district ON hospitals(district_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_type ON hospitals(type);
CREATE INDEX IF NOT EXISTS idx_doctor_specialties_specialty ON doctor_specialties(specialty_id);
CREATE INDEX IF NOT EXISTS idx_doctor_hospitals_hospital ON doctor_hospitals(hospital_id);
CREATE INDEX IF NOT EXISTS idx_reviews_doctor ON reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_symptom_keywords ON symptom_mappings USING gin (symptom_keywords);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS)
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public read access for all main tables
CREATE POLICY "Public read access for doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Public read access for hospitals" ON hospitals FOR SELECT USING (true);
CREATE POLICY "Public read access for specialties" ON specialties FOR SELECT USING (true);
CREATE POLICY "Public read access for reviews" ON reviews FOR SELECT USING (true);

-- Authenticated write access for reviews
CREATE POLICY "Authenticated users can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Admin full access
CREATE POLICY "Admin full access doctors" ON doctors FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access hospitals" ON hospitals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access specialties" ON specialties FOR ALL USING (auth.role() = 'service_role');

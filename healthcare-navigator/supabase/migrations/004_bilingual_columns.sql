-- Add bilingual columns for Bengali data localization
-- Migration: 004_bilingual_columns

-- Districts bilingual
ALTER TABLE districts ADD COLUMN IF NOT EXISTS name_bn TEXT;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS division_bn TEXT;

-- Specialties bilingual
ALTER TABLE specialties ADD COLUMN IF NOT EXISTS name_bn TEXT;
ALTER TABLE specialties ADD COLUMN IF NOT EXISTS description_bn TEXT;

-- Hospitals bilingual
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS name_bn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS address_bn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS departments_bn TEXT[] DEFAULT '{}';

-- Doctors bilingual
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS name_bn TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS qualifications_bn TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS chamber_address_bn TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS bio_bn TEXT;

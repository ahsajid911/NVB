-- Fix permissions after schema recreation + Add bilingual columns
-- Migration: 004_bilingual_and_permissions

-- =============================================
-- PART 1: Fix permissions (CRITICAL)
-- =============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- =============================================
-- PART 2: Add bilingual columns
-- =============================================
ALTER TABLE districts ADD COLUMN IF NOT EXISTS name_bn TEXT;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS division_bn TEXT;
ALTER TABLE specialties ADD COLUMN IF NOT EXISTS name_bn TEXT;
ALTER TABLE specialties ADD COLUMN IF NOT EXISTS description_bn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS name_bn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS address_bn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS departments_bn TEXT[] DEFAULT '{}';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS name_bn TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS qualifications_bn TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS chamber_address_bn TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS bio_bn TEXT;

-- Seed data for Healthcare Navigator Bangladesh
-- Run after 001_initial_schema.sql

-- Districts
INSERT INTO districts (id, name, division) VALUES
  ('1', 'Dhaka', 'Dhaka'),
  ('2', 'Chittagong', 'Chittagong'),
  ('3', 'Sylhet', 'Sylhet'),
  ('4', 'Rajshahi', 'Rajshahi'),
  ('5', 'Khulna', 'Khulna'),
  ('6', 'Barisal', 'Barisal'),
  ('7', 'Rangpur', 'Rangpur'),
  ('8', 'Mymensingh', 'Mymensingh'),
  ('9', 'Comilla', 'Chittagong'),
  ('10', 'Gazipur', 'Dhaka')
ON CONFLICT (id) DO NOTHING;

-- Specialties
INSERT INTO specialties (id, name, slug, description, icon) VALUES
  ('1', 'Cardiologist', 'cardiologist', 'Specializes in heart and cardiovascular system disorders including heart disease, hypertension, and arrhythmias.', 'heart-pulse'),
  ('2', 'Neurologist', 'neurologist', 'Treats disorders of the nervous system including brain, spinal cord, and nerve conditions.', 'brain'),
  ('3', 'Dermatologist', 'dermatologist', 'Specializes in skin, hair, and nail conditions including acne, eczema, and skin cancer.', 'scan-face'),
  ('4', 'Orthopedic Surgeon', 'orthopedic-surgeon', 'Treats musculoskeletal system conditions including bones, joints, muscles, and ligaments.', 'bone'),
  ('5', 'Gastroenterologist', 'gastroenterologist', 'Specializes in digestive system disorders including stomach, intestines, liver, and pancreas.', 'stethoscope'),
  ('6', 'Psychiatrist', 'psychiatrist', 'Treats mental health disorders including depression, anxiety, bipolar disorder, and schizophrenia.', 'brain-cog'),
  ('7', 'ENT Specialist', 'ent-specialist', 'Treats ear, nose, and throat conditions including hearing loss, sinusitis, and tonsillitis.', 'ear'),
  ('8', 'Gynecologist', 'gynecologist', 'Specializes in female reproductive health including pregnancy, menstruation, and fertility.', 'baby'),
  ('9', 'Pediatrician', 'pediatrician', 'Provides medical care for infants, children, and adolescents.', 'baby'),
  ('10', 'Oncologist', 'oncologist', 'Specializes in cancer diagnosis, treatment, and management.', 'ribbon'),
  ('11', 'Pulmonologist', 'pulmonologist', 'Treats respiratory system conditions including lungs, airways, and breathing disorders.', 'wind'),
  ('12', 'Urologist', 'urologist', 'Specializes in urinary tract and male reproductive system conditions.', 'droplets'),
  ('13', 'Ophthalmologist', 'ophthalmologist', 'Treats eye conditions including vision problems, glaucoma, and cataracts.', 'eye'),
  ('14', 'Endocrinologist', 'endocrinologist', 'Specializes in hormonal and metabolic disorders including diabetes and thyroid conditions.', 'activity'),
  ('15', 'General Surgeon', 'general-surgeon', 'Performs surgical procedures for a wide range of conditions affecting the abdomen, skin, and soft tissues.', 'scissors')
ON CONFLICT (id) DO NOTHING;

-- Hospitals (sample - 20 hospitals)
INSERT INTO hospitals (id, name, district_id, type, address, contact_phone, contact_email, website, departments, latitude, longitude) VALUES
  ('1', 'Square Hospital', '1', 'private', '18/F, Bir Uttam Qazi Nuruzzaman Road, West Panthapath, Dhaka 1205', '+880-2-8144400', 'info@squarehospital.com', 'https://squarehospital.com', ARRAY['Cardiology','Neurology','Orthopedics','Oncology','Pediatrics','Gastroenterology','ENT','Dermatology','Psychiatry','General Surgery'], 23.7509, 90.3850),
  ('2', 'Bangabandhu Sheikh Mujib Medical University', '1', 'government', 'Shahbagh, Dhaka 1000', '+880-2-8614545', 'info@bsmmu.org', 'https://bsmmu.edu.bd', ARRAY['Cardiology','Neurology','Orthopedics','Oncology','Pediatrics','Gastroenterology','ENT','Psychiatry','General Surgery','Pulmonology'], 23.7388, 90.3954),
  ('3', 'United Hospital', '1', 'private', 'Plot 81, Road 17/A, Banani, Dhaka 1213', '+880-2-55020001', 'info@uhdl.com', 'https://unitedhospital.com.bd', ARRAY['Cardiology','Neurology','Orthopedics','Ophthalmology','Urology','Gastroenterology','ENT','Dermatology'], 23.7930, 90.4026),
  ('4', 'BIRDEM General Hospital', '1', 'government', 'Shahbagh, Dhaka 1000', '+880-2-8614545', 'info@birdem.gov.bd', null, ARRAY['Cardiology','Endocrinology','Gastroenterology','Nephrology','Neurology','Ophthalmology'], 23.7390, 90.3950),
  ('5', 'Evercare Hospital Dhaka', '1', 'private', 'Plot 81, Block E, Bashundhara R/A, Dhaka 1229', '+880-2-55020001', 'info@evercarebd.com', 'https://evercarebd.com', ARRAY['Cardiology','Neurology','Orthopedics','Oncology','Pediatrics','Gastroenterology','ENT','Dermatology','Psychiatry','Pulmonology','Urology','Ophthalmology'], 23.8103, 90.4320),
  ('6', 'Chittagong Medical College Hospital', '2', 'government', 'Chittagong Medical College Road, Chittagong 4203', '+880-31-611584', null, null, ARRAY['Cardiology','Neurology','Orthopedics','General Surgery','Pediatrics','ENT'], 22.3553, 91.7832),
  ('7', 'Max Hospital Chittagong', '2', 'private', '30/B, Dampara, Chittagong 4202', '+880-31-650000', 'info@maxhospitalctg.com', null, ARRAY['Cardiology','Orthopedics','ENT','Gastroenterology','Dermatology'], 22.3420, 91.7930),
  ('8', 'Sylhet MAG Osmani Medical College', '3', 'government', 'Sylhet-3100', '+880-821-713065', null, null, ARRAY['Cardiology','Neurology','Orthopedics','General Surgery','Pediatrics','ENT','Gynecology'], 24.8949, 91.8687),
  ('9', 'Ibn Sina Hospital Sylhet', '3', 'private', 'Zindabazar, Sylhet 3100', '+880-821-713833', null, null, ARRAY['Cardiology','Neurology','Orthopedics','Gastroenterology','ENT','Dermatology'], 24.9010, 91.8710),
  ('10', 'Rajshahi Medical College Hospital', '4', 'government', 'Rajshahi Medical College Road, Rajshahi 6209', '+880-721-771144', null, null, ARRAY['Cardiology','Neurology','Orthopedics','General Surgery','Pediatrics'], 24.3642, 88.6154),
  ('11', 'Rajshahi City Hospital', '4', 'private', 'Shaheb Bazar, Rajshahi 6201', '+880-721-811020', null, null, ARRAY['Cardiology','Orthopedics','ENT','Gastroenterology','Dermatology'], 24.3720, 88.6090),
  ('12', 'Khulna Medical College Hospital', '5', 'government', 'Khulna Medical College Road, Khulna 9208', '+880-41-720151', null, null, ARRAY['Cardiology','Orthopedics','General Surgery','Pediatrics','ENT'], 22.8125, 89.5470),
  ('13', 'Khulna City Medical College', '5', 'private', 'Sher-E-Bangla Road, Khulna 9208', '+880-41-722444', null, null, ARRAY['Cardiology','Orthopedics','Gastroenterology','Dermatology','ENT'], 22.8200, 89.5500),
  ('14', 'Barisal Sher-e-Bangla Medical College', '6', 'government', 'Barisal-8200', '+880-431-63040', null, null, ARRAY['General Surgery','Pediatrics','ENT','Orthopedics'], 22.7010, 90.3535),
  ('15', 'Rangpur Medical College Hospital', '7', 'government', 'Rangpur-5400', '+880-521-52056', null, null, ARRAY['Cardiology','Orthopedics','General Surgery','Pediatrics'], 25.7460, 89.2500),
  ('16', 'Mymensingh Medical College Hospital', '8', 'government', 'Mymensingh-2200', '+880-91-63204', null, null, ARRAY['Cardiology','Orthopedics','General Surgery','Pediatrics','ENT'], 24.7470, 90.4200),
  ('17', 'OMIC Hospital Comilla', '9', 'private', 'Comilla-3500', '+880-81-65222', null, null, ARRAY['Cardiology','Orthopedics','ENT','Gastroenterology'], 23.4610, 91.1850),
  ('18', 'Gazipur Medical College Hospital', '10', 'government', 'Gazipur-1700', '+880-2-9920140', null, null, ARRAY['General Surgery','Pediatrics','Orthopedics','ENT'], 23.9999, 90.4200),
  ('19', 'Labaid Hospital Dhanmondi', '1', 'private', 'Road 4, Dhanmondi, Dhaka 1205', '+880-2-9661151', 'info@labaidgroup.com', 'https://labaidgroup.com', ARRAY['Cardiology','Neurology','Orthopedics','Oncology','Gastroenterology','ENT','Dermatology','Psychiatry','Pulmonology','Urology','Ophthalmology','Endocrinology'], 23.7461, 90.3742),
  ('20', 'Apollo Hospitals Dhaka', '1', 'private', 'Plot 81, Block E, Bashundhara R/A, Dhaka 1229', '+880-2-55020001', 'info@apollodhaka.com', 'https://apollohospitals.com.bd', ARRAY['Cardiology','Neurology','Orthopedics','Oncology','Pediatrics','Gastroenterology','ENT','Dermatology','Psychiatry','Pulmonology','Urology','Ophthalmology','Endocrinology','General Surgery'], 23.8168, 90.4286)
ON CONFLICT (id) DO NOTHING;

-- Note: Full seed data for doctors, doctor_specialties, doctor_hospitals, and symptom_mappings
-- is available in src/data/seed.ts and can be imported via the admin CSV import feature.
-- The above SQL provides the foundational tables and reference data.

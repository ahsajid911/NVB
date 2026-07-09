import { HealthcareContext } from "./types";

/**
 * Shared static healthcare context used to ground the AI chat and symptom
 * analysis. Previously this ~100-line array was duplicated identically in both
 * /api/ai/chat and /api/ai/symptom-analysis route handlers.
 */
export function buildContext(): HealthcareContext {
  return {
    hospitals: [
      { name: "Square Hospital", address: "18/F, Bir Uttam Qazi Nuruzzaman Road, West Panthapath, Dhaka 1205", departments: ["Cardiology", "Neurology", "Orthopedics", "Oncology", "Pediatrics", "Gastroenterology", "ENT", "Dermatology", "Psychiatry", "General Surgery"] },
      { name: "Bangabandhu Sheikh Mujib Medical University", address: "Shahbagh, Dhaka 1000", departments: ["Cardiology", "Neurology", "Orthopedics", "Oncology", "Pediatrics", "Gastroenterology", "ENT", "Psychiatry", "General Surgery", "Pulmonology"] },
      { name: "United Hospital", address: "Plot 81, Road 17/A, Banani, Dhaka 1213", departments: ["Cardiology", "Neurology", "Orthopedics", "Ophthalmology", "Urology", "Gastroenterology", "ENT", "Dermatology"] },
      { name: "BIRDEM General Hospital", address: "Shahbagh, Dhaka 1000", departments: ["Cardiology", "Endocrinology", "Gastroenterology", "Nephrology", "Neurology", "Ophthalmology"] },
      { name: "Evercare Hospital Dhaka", address: "Plot 81, Block E, Bashundhara R/A, Dhaka 1229", departments: ["Cardiology", "Neurology", "Orthopedics", "Oncology", "Pediatrics", "Gastroenterology", "ENT", "Dermatology", "Psychiatry", "Pulmonology", "Urology", "Ophthalmology"] },
      { name: "Labaid Hospital Dhanmondi", address: "Road 4, Dhanmondi, Dhaka 1205", departments: ["Cardiology", "Neurology", "Orthopedics", "Oncology", "Gastroenterology", "ENT", "Dermatology", "Psychiatry", "Pulmonology", "Urology", "Ophthalmology", "Endocrinology"] },
      { name: "Apollo Hospitals Dhaka", address: "Plot 81, Block E, Bashundhara R/A, Dhaka 1229", departments: ["Cardiology", "Neurology", "Orthopedics", "Oncology", "Pediatrics", "Gastroenterology", "ENT", "Dermatology", "Psychiatry", "Pulmonology", "Urology", "Ophthalmology", "Endocrinology", "General Surgery"] },
      { name: "Chittagong Medical College Hospital", address: "Chittagong Medical College Road, Chittagong 4203", departments: ["Cardiology", "Neurology", "Orthopedics", "General Surgery", "Pediatrics", "ENT"] },
    ],
    doctors: [
      { name: "Dr. Aminul Haque", specialty: "Cardiologist", hospital: "Square Hospital", fee: 2000 },
      { name: "Dr. Fatema Begum", specialty: "Cardiologist", hospital: "United Hospital", fee: 1800 },
      { name: "Dr. Rafiqul Islam", specialty: "Neurologist", hospital: "Square Hospital", fee: 2500 },
      { name: "Dr. Nasreen Akhter", specialty: "Neurologist", hospital: "United Hospital", fee: 1500 },
      { name: "Dr. Kamal Hossain", specialty: "Dermatologist", hospital: "Labaid Hospital", fee: 1000 },
      { name: "Dr. Md. Shahidullah", specialty: "Orthopedic Surgeon", hospital: "Square Hospital", fee: 1500 },
      { name: "Dr. Anisur Rahman", specialty: "Gastroenterologist", hospital: "Square Hospital", fee: 1600 },
      { name: "Dr. Farhana Islam", specialty: "Psychiatrist", hospital: "National Institute of Mental Health", fee: 1400 },
      { name: "Dr. Muhammad Karim", specialty: "ENT Specialist", hospital: "United Hospital", fee: 1200 },
      { name: "Dr. Shirin Sultana", specialty: "Gynecologist", hospital: "Square Hospital", fee: 1500 },
      { name: "Dr. Hasan Mahmud", specialty: "Pediatrician", hospital: "BSMMU", fee: 1300 },
      { name: "Dr. Abdul Motalib", specialty: "Oncologist", hospital: "National Cancer Research Institute", fee: 2200 },
      { name: "Dr. Kamrun Nahar", specialty: "Pulmonologist", hospital: "Square Hospital", fee: 1400 },
      { name: "Dr. Shafiqur Rahman", specialty: "Urologist", hospital: "Apollo Hospital", fee: 1600 },
      { name: "Dr. Salma Akter", specialty: "Ophthalmologist", hospital: "BIRDEM Eye Hospital", fee: 1200 },
      { name: "Dr. Jahangir Alam", specialty: "Endocrinologist", hospital: "BIRDEM Hospital", fee: 1500 },
      { name: "Dr. Roksana Begum", specialty: "General Surgeon", hospital: "Square Hospital", fee: 1500 },
    ],
    specialties: [
      { name: "Cardiologist", description: "Specializes in heart and cardiovascular system disorders including heart disease, hypertension, and arrhythmias." },
      { name: "Neurologist", description: "Treats disorders of the nervous system including brain, spinal cord, and nerve conditions." },
      { name: "Dermatologist", description: "Specializes in skin, hair, and nail conditions including acne, eczema, and skin cancer." },
      { name: "Orthopedic Surgeon", description: "Treats musculoskeletal system conditions including bones, joints, muscles, and ligaments." },
      { name: "Gastroenterologist", description: "Specializes in digestive system disorders including stomach, intestines, liver, and pancreas." },
      { name: "Psychiatrist", description: "Treats mental health disorders including depression, anxiety, bipolar disorder, and schizophrenia." },
      { name: "ENT Specialist", description: "Treats ear, nose, and throat conditions including hearing loss, sinusitis, and tonsillitis." },
      { name: "Gynecologist", description: "Specializes in female reproductive health including pregnancy, menstruation, and fertility." },
      { name: "Pediatrician", description: "Provides medical care for infants, children, and adolescents." },
      { name: "Oncologist", description: "Specializes in cancer diagnosis, treatment, and management." },
      { name: "Pulmonologist", description: "Treats respiratory system conditions including lungs, airways, and breathing disorders." },
      { name: "Urologist", description: "Specializes in urinary tract and male reproductive system conditions." },
      { name: "Ophthalmologist", description: "Treats eye conditions including vision problems, glaucoma, and cataracts." },
      { name: "Endocrinologist", description: "Specializes in hormonal and metabolic disorders including diabetes and thyroid conditions." },
      { name: "General Surgeon", description: "Performs surgical procedures for a wide range of conditions." },
    ],
  };
}

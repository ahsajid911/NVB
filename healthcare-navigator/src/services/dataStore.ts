import {
  districts as seedDistricts,
  specialties as seedSpecialties,
  hospitals as seedHospitals,
  doctors as seedDoctors,
  doctorSpecialties as seedDoctorSpecialties,
  doctorHospitals as seedDoctorHospitals,
  symptomMappings as seedSymptomMappings,
} from "@/data/seed";

let _districts = [...seedDistricts];
let _specialties = [...seedSpecialties];
let _hospitals = [...seedHospitals];
let _doctors = [...seedDoctors];
let _doctorSpecialties = [...seedDoctorSpecialties];
let _doctorHospitals = [...seedDoctorHospitals];
let _symptomMappings = [...seedSymptomMappings];

export const dataStore = {
  getDistricts: () => _districts,
  getSpecialties: () => _specialties,
  getHospitals: () => _hospitals,
  getDoctors: () => _doctors,
  getDoctorSpecialties: () => _doctorSpecialties,
  getDoctorHospitals: () => _doctorHospitals,
  getSymptomMappings: () => _symptomMappings,

  addDoctor: (doctor: any) => { _doctors.push(doctor); return doctor; },
  addDoctors: (doctors: any[]) => { _doctors.push(...doctors); return doctors; },
  deleteDoctor: (id: string) => {
    _doctors = _doctors.filter((d) => d.id !== id);
    _doctorSpecialties = _doctorSpecialties.filter((ds) => ds.doctor_id !== id);
    _doctorHospitals = _doctorHospitals.filter((dh) => dh.doctor_id !== id);
  },
  deleteDoctors: (ids: string[]) => {
    _doctors = _doctors.filter((d) => !ids.includes(d.id));
    _doctorSpecialties = _doctorSpecialties.filter((ds) => !ids.includes(ds.doctor_id));
    _doctorHospitals = _doctorHospitals.filter((dh) => !ids.includes(dh.doctor_id));
  },

  addHospital: (hospital: any) => { _hospitals.push(hospital); return hospital; },
  addHospitals: (hospitals: any[]) => { _hospitals.push(...hospitals); return hospitals; },
  deleteHospital: (id: string) => {
    _hospitals = _hospitals.filter((h) => h.id !== id);
    _doctorHospitals = _doctorHospitals.filter((dh) => dh.hospital_id !== id);
  },
  deleteHospitals: (ids: string[]) => {
    _hospitals = _hospitals.filter((h) => !ids.includes(h.id));
    _doctorHospitals = _doctorHospitals.filter((dh) => !ids.includes(dh.hospital_id));
  },

  addSpecialty: (specialty: any) => { _specialties.push(specialty); return specialty; },
  addSpecialties: (specialties: any[]) => { _specialties.push(...specialties); return specialties; },
  deleteSpecialty: (id: string) => {
    _specialties = _specialties.filter((s) => s.id !== id);
    _doctorSpecialties = _doctorSpecialties.filter((ds) => ds.specialty_id !== id);
  },
  deleteSpecialties: (ids: string[]) => {
    _specialties = _specialties.filter((s) => !ids.includes(s.id));
    _doctorSpecialties = _doctorSpecialties.filter((ds) => !ids.includes(ds.specialty_id));
  },

  getStats: () => ({
    doctors: _doctors.length,
    hospitals: _hospitals.length,
    specialties: _specialties.length,
    districts: _districts.length,
  }),
};

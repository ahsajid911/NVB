"use client";

import { useState, useCallback, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface AdminStats {
  doctors: number;
  hospitals: number;
  specialties: number;
  districts: number;
}

export function useAdminData() {
  const [stats, setStats] = useState<AdminStats>({ doctors: 0, hospitals: 0, specialties: 0, districts: 0 });
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [specialtiesList, setSpecialtiesList] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch("/api/data/stats");
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  const fetchDoctors = useCallback(async () => {
    setDataLoading(true);
    try {
      const res = await apiFetch("/api/data?type=doctors");
      const json = await res.json();
      setDoctorsList(json.data || []);
    } catch { setDoctorsList([]); }
    setDataLoading(false);
  }, []);

  const fetchHospitals = useCallback(async () => {
    setDataLoading(true);
    try {
      const res = await apiFetch("/api/data?type=hospitals");
      const json = await res.json();
      setHospitalsList(json.data || []);
    } catch { setHospitalsList([]); }
    setDataLoading(false);
  }, []);

  const fetchSpecialties = useCallback(async () => {
    setDataLoading(true);
    try {
      const res = await apiFetch("/api/data?type=specialties");
      const json = await res.json();
      setSpecialtiesList(json.data || []);
    } catch { setSpecialtiesList([]); }
    setDataLoading(false);
  }, []);

  const fetchAll = useCallback(() => {
    fetchStats();
    fetchDoctors();
    fetchHospitals();
    fetchSpecialties();
  }, [fetchStats, fetchDoctors, fetchHospitals, fetchSpecialties]);

  return {
    stats,
    doctorsList,
    hospitalsList,
    specialtiesList,
    dataLoading,
    fetchStats,
    fetchDoctors,
    fetchHospitals,
    fetchSpecialties,
    fetchAll,
  };
}

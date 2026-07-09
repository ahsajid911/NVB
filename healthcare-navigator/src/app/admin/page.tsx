"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import {
  Upload, FileText, Download, BarChart3, Users, Building2, Stethoscope,
  Plus, Trash2, Search, X, CheckSquare, Square, ChevronDown, ChevronUp,
  AlertTriangle, Edit3, RefreshCw,
} from "lucide-react";

type Tab = "overview" | "doctors" | "hospitals" | "specialties";
type Action = "view" | "add-single" | "add-multi" | "delete-single" | "delete-multi";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [doctorAction, setDoctorAction] = useState<Action>("view");
  const [hospitalAction, setHospitalAction] = useState<Action>("view");
  const [specialtyAction, setSpecialtyAction] = useState<Action>("view");

  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [importType, setImportType] = useState<"doctors" | "hospitals" | "specialties">("doctors");
  const [importResult, setImportResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState({ doctors: 0, hospitals: 0, specialties: 0, districts: 0 });
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [specialtiesList, setSpecialtiesList] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

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

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    if (activeTab === "doctors") fetchDoctors();
    if (activeTab === "hospitals") fetchHospitals();
    if (activeTab === "specialties") fetchSpecialties();
  }, [activeTab, fetchDoctors, fetchHospitals, fetchSpecialties]);

  const refreshAll = () => { fetchStats(); if (activeTab === "doctors") fetchDoctors(); if (activeTab === "hospitals") fetchHospitals(); if (activeTab === "specialties") fetchSpecialties(); };

  const doctors = searchQuery ? doctorsList.filter((d) => d.name?.toLowerCase().includes(searchQuery.toLowerCase())) : doctorsList;
  const hospitals = searchQuery ? hospitalsList.filter((h) => h.name?.toLowerCase().includes(searchQuery.toLowerCase())) : hospitalsList;
  const specialties = searchQuery ? specialtiesList.filter((s) => s.name?.toLowerCase().includes(searchQuery.toLowerCase())) : specialtiesList;

  // ---- DELETE HANDLERS ----
  const handleDeleteSingle = async (type: "doctors" | "hospitals" | "specialties", id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await apiFetch("/api/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ids: [id] }),
      });
      if (res.ok) { showMessage("success", "Deleted successfully"); refreshAll(); }
      else { const e = await res.json(); showMessage("error", e.error || "Delete failed"); }
    } catch { showMessage("error", "Network error"); }
  };

  const handleDeleteMulti = async (type: "doctors" | "hospitals" | "specialties") => {
    const selected = type === "doctors" ? selectedDoctors : type === "hospitals" ? selectedHospitals : selectedSpecialties;
    if (selected.length === 0) { showMessage("error", "No items selected"); return; }
    if (!confirm(`Delete ${selected.length} selected items?`)) return;
    try {
      const res = await apiFetch("/api/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ids: selected }),
      });
      if (res.ok) {
        if (type === "doctors") setSelectedDoctors([]);
        else if (type === "hospitals") setSelectedHospitals([]);
        else setSelectedSpecialties([]);
        showMessage("success", `${selected.length} items deleted`);
        refreshAll();
      } else { const e = await res.json(); showMessage("error", e.error || "Delete failed"); }
    } catch { showMessage("error", "Network error"); }
  };

  const toggleSelect = (type: "doctors" | "hospitals" | "specialties", id: string) => {
    if (type === "doctors") setSelectedDoctors((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
    else if (type === "hospitals") setSelectedHospitals((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
    else setSelectedSpecialties((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = (type: "doctors" | "hospitals" | "specialties") => {
    const list = type === "doctors" ? doctors : type === "hospitals" ? hospitals : specialties;
    const selected = type === "doctors" ? selectedDoctors : type === "hospitals" ? selectedHospitals : selectedSpecialties;
    const allIds = list.map((item: any) => item.id);
    if (type === "doctors") setSelectedDoctors(allIds.length === selected.length ? [] : allIds);
    else if (type === "hospitals") setSelectedHospitals(allIds.length === selected.length ? [] : allIds);
    else setSelectedSpecialties(allIds.length === selected.length ? [] : allIds);
  };

  // ---- ADD SINGLE HANDLERS ----
  const [newDoctor, setNewDoctor] = useState({ name: "", name_bn: "", qualifications: "", qualifications_bn: "", experience_years: 5, consultation_fee: 1000, gender: "male" as const, contact_phone: "", chamber_address: "", chamber_address_bn: "", available_days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"], bio: "", bio_bn: "" });
  const [newHospital, setNewHospital] = useState({ name: "", name_bn: "", district_id: "1", type: "private" as const, address: "", address_bn: "", contact_phone: "", contact_email: "", departments: "", departments_bn: "" });
  const [newSpecialty, setNewSpecialty] = useState({ name: "", name_bn: "", slug: "", description: "", description_bn: "", icon: "stethoscope" });

  const handleAddDoctor = async () => {
    if (!newDoctor.name.trim()) { showMessage("error", "Name is required"); return; }
    setLoading(true);
    try {
      const res = await apiFetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "doctors", item: { ...newDoctor, photo_url: null, contact_email: null } }),
      });
      if (res.ok) {
        setNewDoctor({ name: "", name_bn: "", qualifications: "", qualifications_bn: "", experience_years: 5, consultation_fee: 1000, gender: "male", contact_phone: "", chamber_address: "", chamber_address_bn: "", available_days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"], bio: "", bio_bn: "" });
        showMessage("success", "Doctor added successfully");
        refreshAll();
      } else { const e = await res.json(); showMessage("error", e.error || "Failed"); }
    } catch { showMessage("error", "Network error"); }
    setLoading(false);
  };

  const handleAddHospital = async () => {
    if (!newHospital.name.trim()) { showMessage("error", "Name is required"); return; }
    setLoading(true);
    try {
      const res = await apiFetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "hospitals",
          item: {
            ...newHospital,
            departments: newHospital.departments.split(",").map((d) => d.trim()).filter(Boolean),
            departments_bn: newHospital.departments_bn ? newHospital.departments_bn.split(",").map((d) => d.trim()).filter(Boolean) : [],
            website: null,
          },
        }),
      });
      if (res.ok) {
        setNewHospital({ name: "", name_bn: "", district_id: "1", type: "private", address: "", address_bn: "", contact_phone: "", contact_email: "", departments: "", departments_bn: "" });
        showMessage("success", "Hospital added successfully");
        refreshAll();
      } else { const e = await res.json(); showMessage("error", e.error || "Failed"); }
    } catch { showMessage("error", "Network error"); }
    setLoading(false);
  };

  const handleAddSpecialty = async () => {
    if (!newSpecialty.name.trim()) { showMessage("error", "Name is required"); return; }
    setLoading(true);
    try {
      const res = await apiFetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "specialties", item: newSpecialty }),
      });
      if (res.ok) {
        setNewSpecialty({ name: "", name_bn: "", slug: "", description: "", description_bn: "", icon: "stethoscope" });
        showMessage("success", "Specialty added successfully");
        refreshAll();
      } else { const e = await res.json(); showMessage("error", e.error || "Failed"); }
    } catch { showMessage("error", "Network error"); }
    setLoading(false);
  };

  // ---- ADD MULTI HANDLERS ----
  const [multiDoctorText, setMultiDoctorText] = useState("");
  const [multiHospitalText, setMultiHospitalText] = useState("");
  const [multiSpecialtyText, setMultiSpecialtyText] = useState("");

  const handleAddMultiDoctors = async () => {
    const lines = multiDoctorText.split("\n").filter((l) => l.trim());
    if (lines.length === 0) { showMessage("error", "No data to add"); return; }
    setLoading(true);
    const items = lines.map((line) => {
      const [name, qualifications, experience_years, consultation_fee, gender, contact_phone, chamber_address, name_bn, qualifications_bn, chamber_address_bn, bio, bio_bn] = line.split(",").map((s) => s.trim());
      return {
        name: name || "", name_bn: name_bn || "", qualifications: qualifications || "", qualifications_bn: qualifications_bn || "",
        experience_years: parseInt(experience_years) || 5,
        consultation_fee: parseInt(consultation_fee) || 1000, gender: gender === "female" ? "female" : "male",
        contact_phone: contact_phone || "", contact_email: null, chamber_address: chamber_address || "",
        chamber_address_bn: chamber_address_bn || "",
        available_days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        bio: bio || "", bio_bn: bio_bn || "", photo_url: null,
      };
    });
    try {
      const res = await apiFetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "doctors", items }),
      });
      if (res.ok) { setMultiDoctorText(""); showMessage("success", `${items.length} doctors added`); refreshAll(); }
      else { const e = await res.json(); showMessage("error", e.error || "Failed"); }
    } catch { showMessage("error", "Network error"); }
    setLoading(false);
  };

  const handleAddMultiHospitals = async () => {
    const lines = multiHospitalText.split("\n").filter((l) => l.trim());
    if (lines.length === 0) { showMessage("error", "No data to add"); return; }
    setLoading(true);
    const items = lines.map((line) => {
      const [name, district_id, type, address, contact_phone, departments, name_bn, address_bn, departments_bn] = line.split(",").map((s) => s.trim());
      return {
        name: name || "", name_bn: name_bn || "",
        district_id: district_id || "1",
        type: type === "government" ? "government" : "private", address: address || "",
        address_bn: address_bn || "",
        contact_phone: contact_phone || "", contact_email: null, website: null,
        departments: departments ? departments.split(";").map((d) => d.trim()) : ["General"],
        departments_bn: departments_bn ? departments_bn.split(";").map((d) => d.trim()) : [],
      };
    });
    try {
      const res = await apiFetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "hospitals", items }),
      });
      if (res.ok) { setMultiHospitalText(""); showMessage("success", `${items.length} hospitals added`); refreshAll(); }
      else { const e = await res.json(); showMessage("error", e.error || "Failed"); }
    } catch { showMessage("error", "Network error"); }
    setLoading(false);
  };

  const handleAddMultiSpecialties = async () => {
    const lines = multiSpecialtyText.split("\n").filter((l) => l.trim());
    if (lines.length === 0) { showMessage("error", "No data to add"); return; }
    setLoading(true);
    const items = lines.map((line) => {
      const [name, description, icon, name_bn, description_bn] = line.split(",").map((s) => s.trim());
      return {
        name: name || "", name_bn: name_bn || "",
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        description: description || "", description_bn: description_bn || "",
        icon: icon || "stethoscope",
      };
    });
    try {
      const res = await apiFetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "specialties", items }),
      });
      if (res.ok) { setMultiSpecialtyText(""); showMessage("success", `${items.length} specialties added`); refreshAll(); }
      else { const e = await res.json(); showMessage("error", e.error || "Failed"); }
    } catch { showMessage("error", "Network error"); }
    setLoading(false);
  };

  // ---- DEMO CSV ----
  const demoCSVData: Record<string, { headers: string; rows: string }> = {
    doctors: {
      headers: "name,qualifications,experience_years,consultation_fee,gender,contact_phone,chamber_address,name_bn,qualifications_bn,chamber_address_bn,bio,bio_bn",
      rows: [
        "Dr. John Doe,MBBS MD Cardiology,10,1500,male,+880-1711-001,Square Hospital Room 512 Dhaka,ডঃ জন ডো,এমবিবিএস এমডি কার্ডিওলজি,স্কয়ার হাসপাতাল রুম ৫১২ ঢাকা,Senior cardiologist,সিনিয়র কার্ডিওলজিস্ট",
        "Dr. Jane Smith,MBBS FCPS Neurology,5,1200,female,+880-1711-002,United Hospital Dhaka,ডঃ জেন স্মিথ,এমবিবিএস এফসিপিএস নিউরোলজি,ইউনাইটেড হাসপাতাল ঢাকা,Neurologist specializing in epilepsy,মির্গ বিশেষজ্ঞ নিউরোলজিস্ট",
      ].join("\n"),
    },
    hospitals: {
      headers: "name,district_id,type,address,contact_phone,departments,name_bn,address_bn,departments_bn",
      rows: [
        "City Hospital,1,private,Main Road Dhaka 1205,+880-2-8144400,Cardiology;Neurology;Orthopedics,সিটি হাসপাতাল,মূল সড়ক ঢাকা ১২০৫,কার্ডিওলজি;নিউরোলজি;অর্থোপেডিক্স",
        "General Hospital,2,government,Medical Road Chittagong,+880-31-611584,General Surgery;Pediatrics;ENT,জেনারেল হাসপাতাল,মেডিকেল রোড চট্টগ্রাম,জেনারেল সার্জারি;পেডিয়াট্রিক্স;ইএনটি",
      ].join("\n"),
    },
    specialties: {
      headers: "name,description,icon,name_bn,description_bn",
      rows: [
        "Rheumatologist,Treats autoimmune and joint diseases like arthritis,bone,বাতবিশেষজ্ঞ,বাত ও জয়েন্ট রোগ চিকিৎসা করেন",
        "Allergist,Diagnoses and treats allergies and immune system disorders,wind,অ্যালার্জি বিশেষজ্ঞ,অ্যালার্জি ও ইমিউন সিস্টেম রোগ নির্ণয় ও চিকিৎসা করেন",
      ].join("\n"),
    },
  };

  const getDemoCSVPreview = () => {
    const data = demoCSVData[importType];
    return `${data.headers}\n${data.rows}`;
  };

  const handleDownloadDemo = () => {
    const data = demoCSVData[importType];
    const content = `${data.headers}\n${data.rows}`;
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${importType}_demo.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- EXPORT ----
  const handleExport = (type: string) => {
    let data: any[] = []; let filename = "";
    if (type === "doctors") { data = doctorsList; filename = "doctors_export.csv"; }
    else if (type === "hospitals") { data = hospitalsList; filename = "hospitals_export.csv"; }
    else { data = specialtiesList; filename = "specialties_export.csv"; }
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [headers.join(","), ...data.map((row: any) => headers.map((h) => { const val = row[h]; if (Array.isArray(val)) return `"${val.join("; ")}"`; if (typeof val === "string" && val.includes(",")) return `"${val}"`; return val ?? ""; }).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  // ---- IMPORT ----
  const handleImport = async () => {
    if (!fileRef.current?.files?.[0]) return;
    setLoading(true);
    const file = fileRef.current.files[0];
    try {
      const text = await file.text(); const lines = text.split("\n").filter((l) => l.trim()); const rows = lines.slice(1);
      let imported = 0, skipped = 0; const errors: string[] = [];
      rows.forEach((row, i) => { try { const values = row.split(","); if (values.length < 2) { skipped++; errors.push(`Row ${i + 2}: insufficient columns`); return; } imported++; } catch { skipped++; errors.push(`Row ${i + 2}: parsing error`); } });
      setImportResult({ type: importType, filename: file.name, totalRows: rows.length, imported, skipped, errors: errors.slice(0, 10) });
    } catch { setImportResult({ type: importType, filename: file.name, totalRows: 0, imported: 0, skipped: 0, errors: ["Failed to parse CSV"] }); }
    setLoading(false);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="h-4 w-4" />, count: 0 },
    { id: "doctors", label: "Doctors", icon: <Users className="h-4 w-4" />, count: stats.doctors },
    { id: "hospitals", label: "Hospitals", icon: <Building2 className="h-4 w-4" />, count: stats.hospitals },
    { id: "specialties", label: "Specialties", icon: <Stethoscope className="h-4 w-4" />, count: stats.specialties },
  ];

  const getAction = (tab: Tab) => tab === "doctors" ? doctorAction : tab === "hospitals" ? hospitalAction : specialtyAction;
  const setAction = (tab: Tab, action: Action) => {
    if (tab === "doctors") setDoctorAction(action);
    else if (tab === "hospitals") setHospitalAction(action);
    else setSpecialtyAction(action);
    setSearchQuery("");
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-[36px] font-semibold text-[#0f172a] sm:text-[44px] tracking-[-0.374px]" style={{ fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif' }}>
            Admin Dashboard
          </h1>
          <p className="mt-3 text-[18px] text-[#64748b]">Manage doctors, hospitals, and specialties data</p>
        </div>
        <button onClick={refreshAll} className="flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2.5 text-[14px] font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`mb-6 rounded-xl px-5 py-3 text-[14px] font-medium ${message.type === "success" ? "bg-[#dcfce7] text-[#166534] border border-[#86efac]" : "bg-[#fef2f2] text-[#991b1b] border border-[#fca5a5]"}`}>
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? "bg-[#2563eb] text-white" : "bg-white border border-[#e5e7eb] text-[#64748b] hover:bg-[#f8fafc]"}`}>
            {tab.icon}
            {tab.label}
            {tab.count > 0 && <span className={`rounded-full px-2 py-0.5 text-[11px] ${activeTab === tab.id ? "bg-white/20" : "bg-[#f1f5f9]"}`}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[{ icon: <Users className="h-6 w-6" />, label: "Doctors", value: stats.doctors, color: "bg-[#dbeafe] text-[#2563eb]" },
              { icon: <Building2 className="h-6 w-6" />, label: "Hospitals", value: stats.hospitals, color: "bg-[#dcfce7] text-[#16a34a]" },
              { icon: <Stethoscope className="h-6 w-6" />, label: "Specialties", value: stats.specialties, color: "bg-[#fef3c7] text-[#d97706]" },
              { icon: <BarChart3 className="h-6 w-6" />, label: "Districts", value: stats.districts, color: "bg-[#f3e8ff] text-[#9333ea]" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white border border-[#e5e7eb] p-6">
                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl ${stat.color}`}>{stat.icon}</div>
                <p className="mt-4 text-[32px] font-semibold text-[#0f172a]">{stat.value}</p>
                <p className="text-[14px] text-[#64748b]">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Import */}
            <div className="rounded-2xl bg-white border border-[#e5e7eb] p-7">
              <h2 className="text-[21px] font-semibold text-[#0f172a] mb-5 flex items-center gap-2"><Upload className="h-5 w-5 text-[#2563eb]" /> Import CSV</h2>
              <div className="space-y-5">
                <div><label className="text-[14px] font-semibold text-[#475569]">Data Type</label><select value={importType} onChange={(e) => setImportType(e.target.value as any)} className="mt-1 w-full rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[14px] text-[#0f172a] focus:border-[#2563eb] focus:outline-none"><option value="doctors">Doctors</option><option value="hospitals">Hospitals</option><option value="specialties">Specialties</option></select></div>
                <div><label className="text-[14px] font-semibold text-[#475569]">CSV File</label><input ref={fileRef} type="file" accept=".csv" className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[14px] file:mr-3 file:rounded-full file:border-0 file:bg-[#dbeafe] file:px-4 file:py-1.5 file:text-[14px] file:font-semibold file:text-[#2563eb]" /></div>
                <div className="flex gap-3">
                  <button onClick={handleImport} disabled={loading} className="flex-1 rounded-full bg-[#2563eb] px-4 py-3 text-[17px] font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50">{loading ? "Importing..." : "Import Data"}</button>
                  <button onClick={handleDownloadDemo} className="inline-flex items-center gap-2 rounded-full border-2 border-[#e5e7eb] bg-white px-5 py-3 text-[14px] font-medium text-[#475569] hover:border-[#2563eb]/40 hover:text-[#2563eb] transition-colors whitespace-nowrap"><FileText className="h-4 w-4" />Demo CSV</button>
                </div>
                <div className="rounded-xl bg-[#eff6ff] border border-[#bfdbfe] p-4">
                  <p className="text-[13px] font-semibold text-[#1e40af] mb-2">Expected CSV Format for {importType}:</p>
                  <pre className="text-[12px] text-[#1e3a5f] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">{getDemoCSVPreview()}</pre>
                </div>
              </div>
              {importResult && (
                <div className="mt-5 rounded-xl bg-[#f8fafc] border border-[#e5e7eb] p-5">
                  <h3 className="text-[14px] font-semibold text-[#0f172a] mb-2">Import Report</h3>
                  <div className="space-y-1 text-[14px] text-[#475569]">
                    <p>File: {importResult.filename}</p><p>Type: {importResult.type}</p><p>Total rows: {importResult.totalRows}</p>
                    <p className="text-[#16a34a] font-medium">Imported: {importResult.imported}</p>
                    <p className="text-[#d97706] font-medium">Skipped: {importResult.skipped}</p>
                    {importResult.errors.length > 0 && (<div className="mt-2"><p className="text-[#dc2626] font-semibold">Errors:</p>{importResult.errors.map((e: string, i: number) => (<p key={i} className="text-[13px] text-[#dc2626]">{e}</p>))}</div>)}
                  </div>
                </div>
              )}
            </div>

            {/* Export */}
            <div className="rounded-2xl bg-white border border-[#e5e7eb] p-7">
              <h2 className="text-[21px] font-semibold text-[#0f172a] mb-5 flex items-center gap-2"><Download className="h-5 w-5 text-[#2563eb]" /> Export Data</h2>
              <div className="space-y-3">
                {[{ type: "doctors", label: "Export Doctors CSV" }, { type: "hospitals", label: "Export Hospitals CSV" }, { type: "specialties", label: "Export Specialties CSV" }].map((item) => (
                  <button key={item.type} onClick={() => handleExport(item.type)} className="w-full flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-5 py-3.5 text-[15px] font-medium text-[#475569] hover:border-[#2563eb]/30 hover:bg-[#eff6ff] hover:text-[#2563eb] transition-colors">
                    <FileText className="h-5 w-5" />{item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Management Tabs */}
      {(activeTab === "doctors" || activeTab === "hospitals" || activeTab === "specialties") && (
        <div className="space-y-6">
          {/* Action Sub-tabs */}
          <div className="flex flex-wrap gap-2">
            {(["view", "add-single", "add-multi", "delete-single", "delete-multi"] as Action[]).map((action) => {
              const labels: Record<Action, string> = {
                "view": `View All`,
                "add-single": `Add Single`,
                "add-multi": `Add Multiple`,
                "delete-single": `Delete Single`,
                "delete-multi": `Delete Multiple`,
              };
              const icons: Record<Action, React.ReactNode> = {
                "view": <Search className="h-4 w-4" />,
                "add-single": <Plus className="h-4 w-4" />,
                "add-multi": <Plus className="h-4 w-4" />,
                "delete-single": <Trash2 className="h-4 w-4" />,
                "delete-multi": <Trash2 className="h-4 w-4" />,
              };
              const currentAction = getAction(activeTab);
              return (
                <button key={action} onClick={() => setAction(activeTab, action)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${currentAction === action ? "bg-[#0f172a] text-white" : "bg-white border border-[#e5e7eb] text-[#64748b] hover:bg-[#f8fafc]"}`}>
                  {icons[action]}{labels[action]}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          {(getAction(activeTab) === "view" || getAction(activeTab) === "delete-single" || getAction(activeTab) === "delete-multi") && (
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center rounded-full bg-white px-4 py-2.5 border border-[#e5e7eb] focus-within:ring-2 focus-within:ring-[#3b82f6]">
                <Search className="h-4 w-4 text-[#94a3b8] mr-2" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className="flex-1 bg-transparent text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none" />
                {searchQuery && <button onClick={() => setSearchQuery("")}><X className="h-4 w-4 text-[#94a3b8]" /></button>}
              </div>
            </div>
          )}

          {dataLoading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 text-[#2563eb] animate-spin" />
              <span className="ml-2 text-[14px] text-[#64748b]">Loading data...</span>
            </div>
          )}

          {/* VIEW MODE */}
          {!dataLoading && getAction(activeTab) === "view" && (
            <div className="rounded-2xl bg-white border border-[#e5e7eb] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#f8fafc] border-b border-[#e5e7eb]">
                    <tr>
                      {activeTab === "doctors" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Name (EN)</th>}
                      {activeTab === "doctors" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Name (BN)</th>}
                      {activeTab === "doctors" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Qualifications</th>}
                      {activeTab === "doctors" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Experience</th>}
                      {activeTab === "doctors" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Fee</th>}
                      {activeTab === "doctors" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Gender</th>}
                      {activeTab === "hospitals" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Name (EN)</th>}
                      {activeTab === "hospitals" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Name (BN)</th>}
                      {activeTab === "hospitals" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Type</th>}
                      {activeTab === "hospitals" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Phone</th>}
                      {activeTab === "hospitals" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Departments</th>}
                      {activeTab === "specialties" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Name (EN)</th>}
                      {activeTab === "specialties" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Name (BN)</th>}
                      {activeTab === "specialties" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Slug</th>}
                      {activeTab === "specialties" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Description</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {activeTab === "doctors" && doctors.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-[#f8fafc]">
                        <td className="px-5 py-3 text-[14px] font-medium text-[#0f172a]">{doc.name}</td>
                        <td className="px-5 py-3 text-[14px] text-[#64748b]">{doc.name_bn || <span className="text-[#d1d5db] italic">-</span>}</td>
                        <td className="px-5 py-3 text-[13px] text-[#64748b]">{doc.qualifications}</td>
                        <td className="px-5 py-3 text-[13px] text-[#64748b]">{doc.experience_years}y</td>
                        <td className="px-5 py-3 text-[13px] text-[#2563eb] font-medium">&#2547;{doc.consultation_fee}</td>
                        <td className="px-5 py-3 text-[13px] text-[#64748b] capitalize">{doc.gender}</td>
                      </tr>
                    ))}
                    {activeTab === "hospitals" && hospitals.map((hosp: any) => (
                      <tr key={hosp.id} className="hover:bg-[#f8fafc]">
                        <td className="px-5 py-3 text-[14px] font-medium text-[#0f172a]">{hosp.name}</td>
                        <td className="px-5 py-3 text-[14px] text-[#64748b]">{hosp.name_bn || <span className="text-[#d1d5db] italic">-</span>}</td>
                        <td className="px-5 py-3"><span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[12px] font-medium text-[#475569] capitalize">{hosp.type}</span></td>
                        <td className="px-5 py-3 text-[13px] text-[#64748b]">{hosp.contact_phone}</td>
                        <td className="px-5 py-3 text-[13px] text-[#64748b]">{Array.isArray(hosp.departments) ? hosp.departments.length : 0} depts</td>
                      </tr>
                    ))}
                    {activeTab === "specialties" && specialties.map((spec: any) => (
                      <tr key={spec.id} className="hover:bg-[#f8fafc]">
                        <td className="px-5 py-3 text-[14px] font-medium text-[#0f172a]">{spec.name}</td>
                        <td className="px-5 py-3 text-[14px] text-[#64748b]">{spec.name_bn || <span className="text-[#d1d5db] italic">-</span>}</td>
                        <td className="px-5 py-3 text-[13px] text-[#64748b]">{spec.slug}</td>
                        <td className="px-5 py-3 text-[13px] text-[#64748b] max-w-xs truncate">{spec.description}</td>
                      </tr>
                    ))}
                    {((activeTab === "doctors" && doctors.length === 0) || (activeTab === "hospitals" && hospitals.length === 0) || (activeTab === "specialties" && specialties.length === 0)) && (
                      <tr><td colSpan={6} className="px-5 py-12 text-center text-[14px] text-[#94a3b8]">No data found. Try seeding the database first.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADD SINGLE MODE */}
          {!dataLoading && getAction(activeTab) === "add-single" && activeTab === "doctors" && (
            <div className="rounded-2xl bg-white border border-[#e5e7eb] p-7">
              <h3 className="text-[18px] font-semibold text-[#0f172a] mb-5 flex items-center gap-2"><Plus className="h-5 w-5 text-[#2563eb]" /> Add New Doctor</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div><label className="text-[13px] font-semibold text-[#475569]">Name (EN) *</label><input value={newDoctor.name} onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="Dr. John Doe" /></div>
                <div><label className="text-[13px] font-semibold text-[#475569]">Name (BN)</label><input value={newDoctor.name_bn} onChange={(e) => setNewDoctor({ ...newDoctor, name_bn: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="&#2476;&#2494; &#2536; &#2496;" /></div>
                <div><label className="text-[13px] font-semibold text-[#475569]">Qualifications (EN)</label><input value={newDoctor.qualifications} onChange={(e) => setNewDoctor({ ...newDoctor, qualifications: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="MBBS, MD" /></div>
                <div><label className="text-[13px] font-semibold text-[#475569]">Qualifications (BN)</label><input value={newDoctor.qualifications_bn} onChange={(e) => setNewDoctor({ ...newDoctor, qualifications_bn: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="&#2474;&#2494;&#2480;&#2494;&#2474; &#2474;&#2494; &#2476;&#2494;" /></div>
                <div><label className="text-[13px] font-semibold text-[#475569]">Experience (years)</label><input type="number" value={newDoctor.experience_years} onChange={(e) => setNewDoctor({ ...newDoctor, experience_years: parseInt(e.target.value) || 0 })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" /></div>
                <div><label className="text-[13px] font-semibold text-[#475569]">Fee (&#2547;)</label><input type="number" value={newDoctor.consultation_fee} onChange={(e) => setNewDoctor({ ...newDoctor, consultation_fee: parseInt(e.target.value) || 0 })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" /></div>
                <div><label className="text-[13px] font-semibold text-[#475569]">Gender</label><select value={newDoctor.gender} onChange={(e) => setNewDoctor({ ...newDoctor, gender: e.target.value as any })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none"><option value="male">Male</option><option value="female">Female</option></select></div>
                <div><label className="text-[13px] font-semibold text-[#475569]">Phone</label><input value={newDoctor.contact_phone} onChange={(e) => setNewDoctor({ ...newDoctor, contact_phone: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="+880-..." /></div>
                <div className="sm:col-span-2"><label className="text-[13px] font-semibold text-[#475569]">Chamber Address (EN)</label><input value={newDoctor.chamber_address} onChange={(e) => setNewDoctor({ ...newDoctor, chamber_address: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="Hospital Name, Room, City" /></div>
                <div className="sm:col-span-2"><label className="text-[13px] font-semibold text-[#475569]">Chamber Address (BN)</label><input value={newDoctor.chamber_address_bn} onChange={(e) => setNewDoctor({ ...newDoctor, chamber_address_bn: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="&#2476;&#2494;&#2474;&#2454;&#2482;, &#2479;&#2482;, &#2474;&#2476;" /></div>
                <div className="sm:col-span-2"><label className="text-[13px] font-semibold text-[#475569]">Bio (EN)</label><textarea value={newDoctor.bio} onChange={(e) => setNewDoctor({ ...newDoctor, bio: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none resize-none" placeholder="Brief bio..." /></div>
                <div className="sm:col-span-2"><label className="text-[13px] font-semibold text-[#475569]">Bio (BN)</label><textarea value={newDoctor.bio_bn} onChange={(e) => setNewDoctor({ ...newDoctor, bio_bn: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none resize-none" placeholder="&#2472;&#2494;&#2480;&#2467;&#2479; &#2472;..." /></div>
              </div>
              <button onClick={handleAddDoctor} disabled={loading} className="mt-6 rounded-full bg-[#2563eb] px-6 py-3 text-[15px] font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50">{loading ? "Adding..." : "Add Doctor"}</button>
            </div>
          )}

          {!dataLoading && getAction(activeTab) === "add-single" && activeTab === "hospitals" && (
            <div className="rounded-2xl bg-white border border-[#e5e7eb] p-7">
              <h3 className="text-[18px] font-semibold text-[#0f172a] mb-5 flex items-center gap-2"><Plus className="h-5 w-5 text-[#2563eb]" /> Add New Hospital</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div><label className="text-[13px] font-semibold text-[#475569]">Name (EN) *</label><input value={newHospital.name} onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="Hospital Name" /></div>
                <div><label className="text-[13px] font-semibold text-[#475569]">Name (BN)</label><input value={newHospital.name_bn} onChange={(e) => setNewHospital({ ...newHospital, name_bn: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="&#2476;&#2494;&#2474;&#2454;&#2482;&#2494;&#2475; &#2534;" /></div>
                <div><label className="text-[13px] font-semibold text-[#475569]">Type</label><select value={newHospital.type} onChange={(e) => setNewHospital({ ...newHospital, type: e.target.value as any })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none"><option value="private">Private</option><option value="government">Government</option><option value="semi-government">Semi-Government</option><option value="ngo">NGO</option></select></div>
                <div><label className="text-[13px] font-semibold text-[#475569]">District ID</label><input value={newHospital.district_id} onChange={(e) => setNewHospital({ ...newHospital, district_id: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="1" /></div>
                <div><label className="text-[13px] font-semibold text-[#475569]">Phone</label><input value={newHospital.contact_phone} onChange={(e) => setNewHospital({ ...newHospital, contact_phone: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="+880-..." /></div>
                <div className="sm:col-span-2"><label className="text-[13px] font-semibold text-[#475569]">Address (EN)</label><input value={newHospital.address} onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="Full address" /></div>
                <div className="sm:col-span-2"><label className="text-[13px] font-semibold text-[#475569]">Address (BN)</label><input value={newHospital.address_bn} onChange={(e) => setNewHospital({ ...newHospital, address_bn: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="&#2472;&#2494; &#2474;&#2468;&#2494;" /></div>
                <div className="sm:col-span-2"><label className="text-[13px] font-semibold text-[#475569]">Departments EN (comma separated)</label><input value={newHospital.departments} onChange={(e) => setNewHospital({ ...newHospital, departments: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="Cardiology, Neurology, ..." /></div>
                <div className="sm:col-span-2"><label className="text-[13px] font-semibold text-[#475569]">Departments BN (comma separated)</label><input value={newHospital.departments_bn} onChange={(e) => setNewHospital({ ...newHospital, departments_bn: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="&#2474;&#2494;&#2480;&#2494;&#2474;, &#2482;&#2480;..." /></div>
              </div>
              <button onClick={handleAddHospital} disabled={loading} className="mt-6 rounded-full bg-[#2563eb] px-6 py-3 text-[15px] font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50">{loading ? "Adding..." : "Add Hospital"}</button>
            </div>
          )}

          {!dataLoading && getAction(activeTab) === "add-single" && activeTab === "specialties" && (
            <div className="rounded-2xl bg-white border border-[#e5e7eb] p-7">
              <h3 className="text-[18px] font-semibold text-[#0f172a] mb-5 flex items-center gap-2"><Plus className="h-5 w-5 text-[#2563eb]" /> Add New Specialty</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div><label className="text-[13px] font-semibold text-[#475569]">Name (EN) *</label><input value={newSpecialty.name} onChange={(e) => setNewSpecialty({ ...newSpecialty, name: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="Specialty Name" /></div>
                <div><label className="text-[13px] font-semibold text-[#475569]">Name (BN)</label><input value={newSpecialty.name_bn} onChange={(e) => setNewSpecialty({ ...newSpecialty, name_bn: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="&#2474;&#2494;&#2480;&#2494;&#2474; &#2494;&#2480;&#2528;" /></div>
                <div><label className="text-[13px] font-semibold text-[#475569]">Slug</label><input value={newSpecialty.slug} onChange={(e) => setNewSpecialty({ ...newSpecialty, slug: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none" placeholder="auto-generated if empty" /></div>
                <div><label className="text-[13px] font-semibold text-[#475569]">Icon</label><select value={newSpecialty.icon} onChange={(e) => setNewSpecialty({ ...newSpecialty, icon: e.target.value })} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none"><option value="stethoscope">Stethoscope</option><option value="heart-pulse">Heart Pulse</option><option value="brain">Brain</option><option value="bone">Bone</option><option value="eye">Eye</option><option value="baby">Baby</option><option value="activity">Activity</option><option value="wind">Wind</option><option value="droplets">Droplets</option><option value="scissors">Scissors</option></select></div>
                <div className="sm:col-span-2"><label className="text-[13px] font-semibold text-[#475569]">Description (EN)</label><textarea value={newSpecialty.description} onChange={(e) => setNewSpecialty({ ...newSpecialty, description: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none resize-none" placeholder="Description..." /></div>
                <div className="sm:col-span-2"><label className="text-[13px] font-semibold text-[#475569]">Description (BN)</label><textarea value={newSpecialty.description_bn} onChange={(e) => setNewSpecialty({ ...newSpecialty, description_bn: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5 text-[14px] focus:border-[#2563eb] focus:outline-none resize-none" placeholder="&#2474;&#2494;&#2480;&#2528;..." /></div>
              </div>
              <button onClick={handleAddSpecialty} disabled={loading} className="mt-6 rounded-full bg-[#2563eb] px-6 py-3 text-[15px] font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50">{loading ? "Adding..." : "Add Specialty"}</button>
            </div>
          )}

          {/* ADD MULTI MODE */}
          {!dataLoading && getAction(activeTab) === "add-multi" && activeTab === "doctors" && (
            <div className="rounded-2xl bg-white border border-[#e5e7eb] p-7">
              <h3 className="text-[18px] font-semibold text-[#0f172a] mb-3 flex items-center gap-2"><Plus className="h-5 w-5 text-[#2563eb]" /> Add Multiple Doctors</h3>
              <p className="text-[13px] text-[#64748b] mb-4">One doctor per line. Format: Name, Qualifications, Experience, Fee, Gender, Phone, Address, Name_BN, Qualifications_BN, Address_BN, Bio, Bio_BN</p>
              <textarea value={multiDoctorText} onChange={(e) => setMultiDoctorText(e.target.value)} rows={8} className="w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 text-[14px] font-mono focus:border-[#2563eb] focus:outline-none resize-none" placeholder={`Dr. Smith, MBBS MD, 10, 1500, male, +880-1711-001, Square Hospital, ...`} />
              <button onClick={handleAddMultiDoctors} disabled={loading} className="mt-4 rounded-full bg-[#2563eb] px-6 py-3 text-[15px] font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50">{loading ? "Adding..." : "Add All"}</button>
            </div>
          )}

          {!dataLoading && getAction(activeTab) === "add-multi" && activeTab === "hospitals" && (
            <div className="rounded-2xl bg-white border border-[#e5e7eb] p-7">
              <h3 className="text-[18px] font-semibold text-[#0f172a] mb-3 flex items-center gap-2"><Plus className="h-5 w-5 text-[#2563eb]" /> Add Multiple Hospitals</h3>
              <p className="text-[13px] text-[#64748b] mb-4">One hospital per line. Format: Name, DistrictID, Type, Address, Phone, Departments(semi-colon), Name_BN, Address_BN, Departments_BN(semi-colon)</p>
              <textarea value={multiHospitalText} onChange={(e) => setMultiHospitalText(e.target.value)} rows={8} className="w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 text-[14px] font-mono focus:border-[#2563eb] focus:outline-none resize-none" placeholder={`New Hospital, 1, private, Main Road Dhaka, +880-2-123, Cardiology;Neurology, ...`} />
              <button onClick={handleAddMultiHospitals} disabled={loading} className="mt-4 rounded-full bg-[#2563eb] px-6 py-3 text-[15px] font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50">{loading ? "Adding..." : "Add All"}</button>
            </div>
          )}

          {!dataLoading && getAction(activeTab) === "add-multi" && activeTab === "specialties" && (
            <div className="rounded-2xl bg-white border border-[#e5e7eb] p-7">
              <h3 className="text-[18px] font-semibold text-[#0f172a] mb-3 flex items-center gap-2"><Plus className="h-5 w-5 text-[#2563eb]" /> Add Multiple Specialties</h3>
              <p className="text-[13px] text-[#64748b] mb-4">One specialty per line. Format: Name, Description, Icon, Name_BN, Description_BN</p>
              <textarea value={multiSpecialtyText} onChange={(e) => setMultiSpecialtyText(e.target.value)} rows={8} className="w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 text-[14px] font-mono focus:border-[#2563eb] focus:outline-none resize-none" placeholder={`Rheumatologist, Treats autoimmune..., bone, ...`} />
              <button onClick={handleAddMultiSpecialties} disabled={loading} className="mt-4 rounded-full bg-[#2563eb] px-6 py-3 text-[15px] font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50">{loading ? "Adding..." : "Add All"}</button>
            </div>
          )}

          {/* DELETE SINGLE MODE */}
          {!dataLoading && getAction(activeTab) === "delete-single" && (
            <div className="rounded-2xl bg-white border border-[#e5e7eb] overflow-hidden">
              <div className="px-5 py-4 bg-[#fef2f2] border-b border-[#fecaca]">
                <p className="text-[14px] font-medium text-[#991b1b] flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Click delete on any row to remove it. This cannot be undone.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#f8fafc] border-b border-[#e5e7eb]">
                    <tr>
                      <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Name</th>
                      {activeTab === "doctors" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Qualifications</th>}
                      {activeTab === "hospitals" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Type</th>}
                      {activeTab === "specialties" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Slug</th>}
                      <th className="px-5 py-3 text-[13px] font-semibold text-[#475569] w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {(activeTab === "doctors" ? doctors : activeTab === "hospitals" ? hospitals : specialties).map((item: any) => (
                      <tr key={item.id} className="hover:bg-[#fef2f2]/50">
                        <td className="px-5 py-3 text-[14px] font-medium text-[#0f172a]">{item.name}</td>
                        {activeTab === "doctors" && <td className="px-5 py-3 text-[13px] text-[#64748b]">{item.qualifications}</td>}
                        {activeTab === "hospitals" && <td className="px-5 py-3 text-[13px] text-[#64748b] capitalize">{item.type}</td>}
                        {activeTab === "specialties" && <td className="px-5 py-3 text-[13px] text-[#64748b]">{item.slug}</td>}
                        <td className="px-5 py-3">
                          <button onClick={() => handleDeleteSingle(activeTab as any, item.id)} className="inline-flex items-center gap-1 rounded-lg bg-[#dc2626] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#b91c1c] transition-colors">
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DELETE MULTI MODE */}
          {!dataLoading && getAction(activeTab) === "delete-multi" && (
            <div className="rounded-2xl bg-white border border-[#e5e7eb] overflow-hidden">
              <div className="px-5 py-4 bg-[#fef2f2] border-b border-[#fecaca] flex items-center justify-between">
                <p className="text-[14px] font-medium text-[#991b1b] flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Select items and click delete. This cannot be undone.</p>
                <button onClick={() => handleDeleteMulti(activeTab as any)}
                  disabled={(activeTab === "doctors" ? selectedDoctors : activeTab === "hospitals" ? selectedHospitals : selectedSpecialties).length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#dc2626] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#b91c1c] transition-colors disabled:opacity-50">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Selected ({activeTab === "doctors" ? selectedDoctors.length : activeTab === "hospitals" ? selectedHospitals.length : selectedSpecialties.length})
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#f8fafc] border-b border-[#e5e7eb]">
                    <tr>
                      <th className="px-5 py-3 w-12">
                        <button onClick={() => toggleSelectAll(activeTab as any)} className="text-[#64748b] hover:text-[#2563eb]">
                          {(activeTab === "doctors" ? selectedDoctors : activeTab === "hospitals" ? selectedHospitals : selectedSpecialties).length === (activeTab === "doctors" ? doctors : activeTab === "hospitals" ? hospitals : specialties).length && (activeTab === "doctors" ? doctors : activeTab === "hospitals" ? hospitals : specialties).length > 0
                            ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                        </button>
                      </th>
                      <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Name</th>
                      {activeTab === "doctors" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Qualifications</th>}
                      {activeTab === "hospitals" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Type</th>}
                      {activeTab === "specialties" && <th className="px-5 py-3 text-[13px] font-semibold text-[#475569]">Slug</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {(activeTab === "doctors" ? doctors : activeTab === "hospitals" ? hospitals : specialties).map((item: any) => {
                      const isSelected = (activeTab === "doctors" ? selectedDoctors : activeTab === "hospitals" ? selectedHospitals : selectedSpecialties).includes(item.id);
                      return (
                        <tr key={item.id} className={`hover:bg-[#fef2f2]/50 cursor-pointer ${isSelected ? "bg-[#fef2f2]" : ""}`} onClick={() => toggleSelect(activeTab as any, item.id)}>
                          <td className="px-5 py-3">
                            {isSelected ? <CheckSquare className="h-5 w-5 text-[#dc2626]" /> : <Square className="h-5 w-5 text-[#d1d5db]" />}
                          </td>
                          <td className="px-5 py-3 text-[14px] font-medium text-[#0f172a]">{item.name}</td>
                          {activeTab === "doctors" && <td className="px-5 py-3 text-[13px] text-[#64748b]">{item.qualifications}</td>}
                          {activeTab === "hospitals" && <td className="px-5 py-3 text-[13px] text-[#64748b] capitalize">{item.type}</td>}
                          {activeTab === "specialties" && <td className="px-5 py-3 text-[13px] text-[#64748b]">{item.slug}</td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

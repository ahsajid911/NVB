"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Loader2, AlertTriangle, Shield, HeartPulse, Activity, Stethoscope, Info, AlertCircle, CheckCircle, MapPin, User, DollarSign, Building2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { apiFetch } from "@/lib/api";

interface SymptomAnalysis {
  severity: string;
  possibleConditions: string[];
  recommendedSpecialty: string;
  selfCare: string[];
  warningSigns: string[];
  recommendation: string;
  emergency: boolean;
}

interface RecommendedDoctor {
  name: string;
  specialty: string;
  hospital: string;
  fee: number;
}

interface RecommendedHospital {
  name: string;
  address: string;
  departments: string[];
  matchScore: number;
}

interface RecommendedSpecialty {
  name: string;
  description: string;
  slug: string;
  doctorCount: number;
}

const SEVERITY_CONFIG: Record<string, { bg: string; color: string; border: string; label: string }> = {
  low: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Low" },
  moderate: { bg: "#fffbeb", color: "#d97706", border: "#fde68a", label: "Moderate" },
  high: { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa", label: "High" },
  critical: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Critical" },
};

export default function AISymptomCheckerPage() {
  const { t } = useLanguage();
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymptomAnalysis | null>(null);
  const [recommendedDoctors, setRecommendedDoctors] = useState<RecommendedDoctor[]>([]);
  const [recommendedHospitals, setRecommendedHospitals] = useState<RecommendedHospital[]>([]);
  const [recommendedSpecialty, setRecommendedSpecialty] = useState<RecommendedSpecialty | null>(null);
  const [error, setError] = useState("");
  const [responseMeta, setResponseMeta] = useState<{ provider: string; time: number } | null>(null);

  const handleSubmit = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setRecommendedDoctors([]);
    setRecommendedHospitals([]);
    setRecommendedSpecialty(null);

    try {
      const res = await apiFetch("/api/ai/symptom-analysis", {
        method: "POST",
        body: JSON.stringify({
          symptoms: symptoms.trim(),
          duration: duration || undefined,
          age: age ? parseInt(age) : undefined,
          gender: gender || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data.analysis);
      setRecommendedDoctors(data.recommendedDoctors || []);
      setRecommendedHospitals(data.recommendedHospitals || []);
      setRecommendedSpecialty(data.recommendedSpecialty || null);
      setResponseMeta({ provider: data.provider, time: data.responseTime });
    } catch (err: any) {
      setError(err.message || "Failed to analyze symptoms. Make sure the AI server is running on port 4000.");
    } finally {
      setLoading(false);
    }
  };

  const severity = result ? SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.moderate : null;

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12 lg:px-10">
      <Link href="/" className="inline-flex items-center gap-2 text-[14px] mb-6" style={{ color: "#6B7280" }}>
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "#dbeafe" }}>
            <HeartPulse className="h-6 w-6" style={{ color: "#2563eb" }} />
          </div>
          <div>
            <h1 className="text-[24px] sm:text-[32px] font-semibold" style={{ color: "#0f172a" }}>{t.symptomAssistant?.title || "AI Symptom Checker"}</h1>
          </div>
        </div>
        <p className="text-[14px] sm:text-[16px]" style={{ color: "#64748b" }}>{t.symptomAssistant?.subtitle || "Describe your symptoms and our AI will provide a health navigation assessment."}</p>
        <div className="mt-3 rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#d97706" }} />
          <p className="text-[12px]" style={{ color: "#92400e" }}>{t.symptomAssistant?.disclaimer || "This is not a medical diagnosis. Please always consult a healthcare professional."}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 sm:p-7 mb-8" style={{ border: "1px solid #e5e7eb" }}>
        <div className="space-y-5">
          <div>
            <label className="block text-[13px] font-semibold mb-2" style={{ color: "#374151" }}>Describe your symptoms *</label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g., I have been experiencing chest pain, shortness of breath, and fatigue..."
              rows={4}
              className="w-full rounded-xl px-4 py-3 text-[14px] leading-relaxed resize-none"
              style={{ border: "1px solid #e5e7eb", outline: "none" }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] font-semibold mb-2" style={{ color: "#374151" }}>Duration</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-[14px]" style={{ border: "1px solid #e5e7eb", outline: "none", backgroundColor: "#ffffff" }}>
                <option value="">Select...</option>
                <option value="less-than-1-day">Less than 1 day</option>
                <option value="1-3-days">1-3 days</option>
                <option value="4-7-days">4-7 days</option>
                <option value="1-2-weeks">1-2 weeks</option>
                <option value="more-than-2-weeks">More than 2 weeks</option>
                <option value="chronic">Chronic (months/years)</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold mb-2" style={{ color: "#374151" }}>Age</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g., 35" min="0" max="150" className="w-full rounded-xl px-4 py-2.5 text-[14px]" style={{ border: "1px solid #e5e7eb", outline: "none" }} />
            </div>
            <div>
              <label className="block text-[13px] font-semibold mb-2" style={{ color: "#374151" }}>Gender</label>
              <div className="flex gap-2">
                {[{ val: "male", label: "Male" }, { val: "female", label: "Female" }, { val: "other", label: "Other" }].map((g) => (
                  <button key={g.val} onClick={() => setGender(gender === g.val ? "" : g.val)} className="flex-1 rounded-xl py-2.5 text-[13px] font-medium transition-colors" style={{ backgroundColor: gender === g.val ? "#2563eb" : "#ffffff", color: gender === g.val ? "#ffffff" : "#475569", border: `1px solid ${gender === g.val ? "#2563eb" : "#e5e7eb"}` }}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-2" style={{ color: "#374151" }}>Additional Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional information about your condition..." rows={2} className="w-full rounded-xl px-4 py-3 text-[14px] leading-relaxed resize-none" style={{ border: "1px solid #e5e7eb", outline: "none" }} />
          </div>

          <button onClick={handleSubmit} disabled={!symptoms.trim() || loading} className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold transition-colors" style={{ backgroundColor: symptoms.trim() && !loading ? "#2563eb" : "#e5e7eb", color: symptoms.trim() && !loading ? "#ffffff" : "#94a3b8" }}>
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing...</> : <><Search className="h-5 w-5" /> Analyze Symptoms</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl p-5 mb-8 flex items-start gap-3" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
          <div>
            <p className="text-[14px] font-semibold" style={{ color: "#dc2626" }}>Analysis Failed</p>
            <p className="text-[13px] mt-1" style={{ color: "#7f1d1d" }}>{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-5">
          {responseMeta && (
            <div className="flex items-center gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
              <Activity className="h-3 w-3" /> Powered by {responseMeta.provider} · {responseMeta.time}ms
            </div>
          )}

          {result.emergency && (
            <div className="rounded-2xl p-6" style={{ backgroundColor: "#fef2f2", border: "2px solid #ef4444" }}>
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="h-6 w-6" style={{ color: "#ef4444" }} />
                <h3 className="text-[18px] font-bold" style={{ color: "#dc2626" }}>Emergency Warning</h3>
              </div>
              <p className="text-[14px]" style={{ color: "#7f1d1d" }}>
                Based on your symptoms, you may need <strong>immediate medical attention</strong>. Please call emergency services or go to the nearest hospital immediately.
              </p>
            </div>
          )}

          <div className="rounded-2xl bg-white p-5 sm:p-6" style={{ border: "1px solid #e5e7eb" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] sm:text-[17px] font-semibold" style={{ color: "#0f172a" }}>Assessment Summary</h3>
              {severity && (
                <span className="rounded-full px-3 py-1 text-[12px] font-semibold" style={{ backgroundColor: severity.bg, color: severity.color, border: `1px solid ${severity.border}` }}>
                  {severity.label} Severity
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: "#f8fafc" }}>
                <div className="flex items-center gap-2 mb-2"><Stethoscope className="h-4 w-4" style={{ color: "#2563eb" }} /><span className="text-[11px] sm:text-[12px] font-semibold" style={{ color: "#64748b" }}>RECOMMENDED SPECIALTY</span></div>
                <p className="text-[15px] font-semibold" style={{ color: "#0f172a" }}>{result.recommendedSpecialty}</p>
              </div>
              <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: "#f8fafc" }}>
                <div className="flex items-center gap-2 mb-2"><Info className="h-4 w-4" style={{ color: "#2563eb" }} /><span className="text-[11px] sm:text-[12px] font-semibold" style={{ color: "#64748b" }}>POSSIBLE CONDITIONS</span></div>
                <div className="flex flex-wrap gap-1.5">
                  {result.possibleConditions.map((c, i) => (
                    <span key={i} className="rounded-full px-2.5 py-0.5 text-[12px] font-medium" style={{ backgroundColor: "#dbeafe", color: "#2563eb" }}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {result.selfCare.length > 0 && (
            <div className="rounded-2xl bg-white p-5 sm:p-6" style={{ border: "1px solid #e5e7eb" }}>
              <div className="flex items-center gap-2 mb-3"><Shield className="h-5 w-5" style={{ color: "#22c55e" }} /><h3 className="text-[15px] sm:text-[17px] font-semibold" style={{ color: "#0f172a" }}>Self-Care Advice</h3></div>
              <ul className="space-y-2">
                {result.selfCare.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px]" style={{ color: "#475569" }}>
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#22c55e" }} /> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.warningSigns.length > 0 && (
            <div className="rounded-2xl bg-white p-5 sm:p-6" style={{ border: "1px solid #e5e7eb" }}>
              <div className="flex items-center gap-2 mb-3"><AlertTriangle className="h-5 w-5" style={{ color: "#f59e0b" }} /><h3 className="text-[15px] sm:text-[17px] font-semibold" style={{ color: "#0f172a" }}>Warning Signs to Watch For</h3></div>
              <ul className="space-y-2">
                {result.warningSigns.map((sign, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px]" style={{ color: "#475569" }}>
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#f59e0b" }} /> {sign}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendation && (
            <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <div className="flex items-center gap-2 mb-2"><HeartPulse className="h-5 w-5" style={{ color: "#2563eb" }} /><h3 className="text-[15px] sm:text-[17px] font-semibold" style={{ color: "#0f172a" }}>Recommendation</h3></div>
              <p className="text-[14px] leading-relaxed" style={{ color: "#1e40af" }}>{result.recommendation}</p>
            </div>
          )}

          {recommendedSpecialty && (
            <div className="rounded-2xl bg-white p-5 sm:p-6" style={{ border: "1px solid #e5e7eb" }}>
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="h-5 w-5" style={{ color: "#2563eb" }} />
                <h3 className="text-[15px] sm:text-[17px] font-semibold" style={{ color: "#0f172a" }}>Specialist You Need</h3>
              </div>
              <Link href={`/specialties/${recommendedSpecialty.slug}`} className="block rounded-xl p-4 transition-colors hover:shadow-md" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <p className="text-[16px] font-bold" style={{ color: "#0f172a" }}>{recommendedSpecialty.name}</p>
                <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "#475569" }}>{recommendedSpecialty.description}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="rounded-full px-3 py-1 text-[12px] font-semibold" style={{ backgroundColor: "#dbeafe", color: "#2563eb" }}>
                    {recommendedSpecialty.doctorCount} doctor{recommendedSpecialty.doctorCount !== 1 ? "s" : ""} available
                  </span>
                  <span className="text-[13px] font-semibold" style={{ color: "#2563eb" }}>View Specialty →</span>
                </div>
              </Link>
            </div>
          )}

          {recommendedDoctors.length > 0 && (
            <div className="rounded-2xl bg-white p-5 sm:p-6" style={{ border: "1px solid #e5e7eb" }}>
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5" style={{ color: "#2563eb" }} />
                <h3 className="text-[15px] sm:text-[17px] font-semibold" style={{ color: "#0f172a" }}>Recommended Doctors</h3>
              </div>
              <div className="space-y-3">
                {recommendedDoctors.map((doc, i) => (
                  <Link key={i} href={`/doctors?search=${encodeURIComponent(doc.name)}`} className="block rounded-xl p-4 transition-colors hover:shadow-md" style={{ backgroundColor: "#f8fafc", border: "1px solid #e5e7eb" }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[15px] font-semibold" style={{ color: "#0f172a" }}>{doc.name}</p>
                        <p className="text-[13px] mt-1" style={{ color: "#2563eb" }}>{doc.specialty}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Building2 className="h-3 w-3" style={{ color: "#64748b" }} />
                          <p className="text-[12px]" style={{ color: "#64748b" }}>{doc.hospital}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-bold" style={{ color: "#0f172a" }}>৳{doc.fee}</p>
                        <p className="text-[11px]" style={{ color: "#64748b" }}>consultation</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href={`/doctors?specialty=${encodeURIComponent(result.recommendedSpecialty)}`} className="mt-3 block text-center rounded-xl py-2.5 text-[13px] font-semibold transition-colors" style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
                View All {result.recommendedSpecialty} Doctors →
              </Link>
            </div>
          )}

          {recommendedHospitals.length > 0 && (
            <div className="rounded-2xl bg-white p-5 sm:p-6" style={{ border: "1px solid #e5e7eb" }}>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5" style={{ color: "#2563eb" }} />
                <h3 className="text-[15px] sm:text-[17px] font-semibold" style={{ color: "#0f172a" }}>Recommended Hospitals</h3>
              </div>
              <div className="space-y-3">
                {recommendedHospitals.map((hosp, i) => (
                  <Link key={i} href={`/hospitals?search=${encodeURIComponent(hosp.name)}`} className="block rounded-xl p-4 transition-colors hover:shadow-md" style={{ backgroundColor: "#f8fafc", border: "1px solid #e5e7eb" }}>
                    <p className="text-[15px] font-semibold" style={{ color: "#0f172a" }}>{hosp.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" style={{ color: "#64748b" }} />
                      <p className="text-[12px]" style={{ color: "#64748b" }}>{hosp.address}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {hosp.departments.filter(d => {
                        const target = result.recommendedSpecialty.toLowerCase().replace(/[^a-z]/g, "");
                        const norm = d.toLowerCase().replace(/[^a-z]/g, "");
                        return norm.includes(target) || target.includes(norm);
                      }).map((d, j) => (
                        <span key={j} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: "#dbeafe", color: "#2563eb" }}>{d}</span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/hospitals" className="mt-3 block text-center rounded-xl py-2.5 text-[13px] font-semibold transition-colors" style={{ backgroundColor: "#ffffff", color: "#2563eb", border: "1px solid #2563eb" }}>
                View All Hospitals →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

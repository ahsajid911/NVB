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
  low: { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", label: "Low" },
  moderate: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", label: "Moderate" },
  high: { bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA", label: "High" },
  critical: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", label: "Critical" },
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
    <div className="mx-auto max-w-[900px] px-6 py-12 lg:px-12">
      <Link href="/" className="inline-flex items-center gap-2 text-[14px] mb-6 text-[#64748B] hover:text-[#0066FF]">
        <ArrowLeft className="h-4 w-4" /> {t.common.backToHome}
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#E8F0FF]">
            <HeartPulse className="h-6 w-6 text-[#0066FF]" />
          </div>
          <div>
            <h1 className="text-[24px] sm:text-[32px] font-bold text-[#1E293B]">{t.symptomAssistant?.title || "AI Symptom Checker"}</h1>
          </div>
        </div>
        <p className="text-[14px] sm:text-[16px] text-[#64748B]">{t.symptomAssistant?.subtitle || "Describe your symptoms and our AI will provide a health navigation assessment."}</p>
        <div className="mt-3 rounded-[8px] p-3 flex items-center gap-2 bg-[#FFFBEB] border border-[#FDE68A]">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[#D97706]" />
          <p className="text-[12px] text-[#92400E]">{t.symptomAssistant?.disclaimer || "This is not a medical diagnosis. Please always consult a healthcare professional."}</p>
        </div>
      </div>

      <div className="rounded-[12px] bg-white p-5 sm:p-7 mb-8 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
        <div className="space-y-5">
          <div>
            <label className="block text-[13px] font-semibold mb-2 text-[#374151]">{t.symptomAssistant?.describeSymptomsLabel || "Describe your symptoms *"}</label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder={t.symptomAssistant?.form?.symptomsPlaceholder || "e.g., I have been experiencing chest pain, shortness of breath, and fatigue..."}
              rows={4}
              className="w-full ds-input rounded-[8px] px-4 py-3 text-[14px] leading-relaxed resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] font-semibold mb-2 text-[#374151]">{t.symptomAssistant?.form?.duration || "Duration"}</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full ds-input rounded-[8px] px-4 py-2.5 text-[14px]">
                <option value="">{t.symptomAssistant?.form?.selectPlaceholder || "Select..."}</option>
                <option value="less-than-1-day">{t.symptomAssistant?.form?.durationOptions?.lessThan1Day || "Less than 1 day"}</option>
                <option value="1-3-days">{t.symptomAssistant?.form?.durationOptions?.["1to3Days"] || "1-3 days"}</option>
                <option value="4-7-days">{t.symptomAssistant?.form?.durationOptions?.["4to7Days"] || "4-7 days"}</option>
                <option value="1-2-weeks">{t.symptomAssistant?.form?.durationOptions?.["1to2Weeks"] || "1-2 weeks"}</option>
                <option value="more-than-2-weeks">{t.symptomAssistant?.form?.durationOptions?.moreThan2Weeks || "More than 2 weeks"}</option>
                <option value="chronic">{t.symptomAssistant?.form?.durationOptions?.chronic || "Chronic (months/years)"}</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold mb-2 text-[#374151]">{t.symptomAssistant?.form?.age || "Age"}</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder={t.symptomAssistant?.form?.agePlaceholder || "e.g., 35"} min="0" max="150" className="w-full ds-input rounded-[8px] px-4 py-2.5 text-[14px]" />
            </div>
            <div>
              <label className="block text-[13px] font-semibold mb-2 text-[#374151]">{t.symptomAssistant?.form?.gender || "Gender"}</label>
              <div className="flex gap-2">
                {[{ val: "male", label: t.symptomAssistant?.form?.genderOptions?.male || "Male" }, { val: "female", label: t.symptomAssistant?.form?.genderOptions?.female || "Female" }, { val: "other", label: t.symptomAssistant?.form?.genderOptions?.other || "Other" }].map((g) => (
                  <button key={g.val} onClick={() => setGender(gender === g.val ? "" : g.val)} className={`flex-1 rounded-[8px] py-2.5 text-[13px] font-medium transition-colors ${gender === g.val ? "bg-[#0066FF] text-white border border-[#0066FF]" : "bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC]"}`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-2 text-[#374151]">{t.symptomAssistant?.form?.additionalNotes || "Additional Notes (optional)"}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.symptomAssistant?.form?.additionalNotesPlaceholder || "Any additional information about your condition..."} rows={2} className="w-full ds-input rounded-[8px] px-4 py-3 text-[14px] leading-relaxed resize-none" />
          </div>

          <button onClick={handleSubmit} disabled={!symptoms.trim() || loading} className={`w-full flex items-center justify-center gap-2 rounded-[8px] px-6 py-3.5 text-[15px] font-semibold transition-colors ${symptoms.trim() && !loading ? "bg-[#0066FF] text-white hover:bg-[#0054D6]" : "bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed"}`}>
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> {t.symptomAssistant?.analyzing || "Analyzing..."}</> : <><Search className="h-5 w-5" /> {t.symptomAssistant?.analyze || "Analyze Symptoms"}</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-[12px] p-5 mb-8 flex items-start gap-3 bg-[#FEF2F2] border border-[#FECACA]">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-[#EF4444]" />
          <div>
            <p className="text-[14px] font-semibold text-[#DC2626]">{t.symptomAssistant?.error?.title || "Analysis Failed"}</p>
            <p className="text-[13px] mt-1 text-[#7F1D1D]">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-5">
          {responseMeta && (
            <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
              <Activity className="h-3 w-3" /> {t.symptomAssistant?.poweredBy?.replace("{provider}", responseMeta.provider)?.replace("{time}", String(responseMeta.time)) || `Powered by ${responseMeta.provider} · ${responseMeta.time}ms`}
            </div>
          )}

          {result.emergency && (
            <div className="rounded-[12px] p-6 bg-[#FEF2F2] border-2 border-[#EF4444]">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="h-6 w-6 text-[#EF4444]" />
                <h3 className="text-[18px] font-bold text-[#DC2626]">{t.symptomAssistant?.emergency?.title || "Emergency Warning"}</h3>
              </div>
              <p className="text-[14px] text-[#7F1D1D]">
                {t.symptomAssistant?.emergency?.message || "Based on your symptoms, you may need immediate medical attention. Please call emergency services or go to the nearest hospital immediately."}
              </p>
            </div>
          )}

          <div className="rounded-[12px] bg-white p-5 sm:p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] sm:text-[17px] font-bold text-[#1E293B]">{t.symptomAssistant?.assessment?.title || "Assessment Summary"}</h3>
              {severity && (
                <span className="rounded-full px-3 py-1 text-[12px] font-semibold" style={{ backgroundColor: severity.bg, color: severity.color, border: `1px solid ${severity.border}` }}>
                  {(t.symptomAssistant?.assessment as Record<string, string>)?.[`severity${severity.label}`] || `${severity.label} Severity`}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-[8px] p-3 sm:p-4 bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center gap-2 mb-2"><Stethoscope className="h-4 w-4 text-[#0066FF]" /><span className="text-[11px] sm:text-[12px] font-semibold text-[#64748B]">{t.symptomAssistant?.assessment?.recommendedSpecialty || "RECOMMENDED SPECIALTY"}</span></div>
                <p className="text-[15px] font-bold text-[#1E293B]">{result.recommendedSpecialty}</p>
              </div>
              <div className="rounded-[8px] p-3 sm:p-4 bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center gap-2 mb-2"><Info className="h-4 w-4 text-[#0066FF]" /><span className="text-[11px] sm:text-[12px] font-semibold text-[#64748B]">{t.symptomAssistant?.assessment?.possibleConditions || "POSSIBLE CONDITIONS"}</span></div>
                <div className="flex flex-wrap gap-1.5">
                  {result.possibleConditions.map((c, i) => (
                    <span key={i} className="ds-chip-blue rounded-full px-2.5 py-0.5 text-[12px] font-medium">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {result.selfCare.length > 0 && (
            <div className="rounded-[12px] bg-white p-5 sm:p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
              <div className="flex items-center gap-2 mb-3"><Shield className="h-5 w-5 text-[#2DD4BF]" /><h3 className="text-[15px] sm:text-[17px] font-bold text-[#1E293B]">{t.symptomAssistant?.selfCare?.title || "Self-Care Advice"}</h3></div>
              <ul className="space-y-2">
                {result.selfCare.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-[#475569]">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#2DD4BF]" /> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.warningSigns.length > 0 && (
            <div className="rounded-[12px] bg-white p-5 sm:p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
              <div className="flex items-center gap-2 mb-3"><AlertTriangle className="h-5 w-5 text-[#F59E0B]" /><h3 className="text-[15px] sm:text-[17px] font-bold text-[#1E293B]">{t.symptomAssistant?.warningSigns?.title || "Warning Signs to Watch For"}</h3></div>
              <ul className="space-y-2">
                {result.warningSigns.map((sign, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-[#475569]">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#F59E0B]" /> {sign}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendation && (
            <div className="rounded-[12px] p-5 sm:p-6 bg-[#E8F0FF] border border-[#BFDBFE]">
              <div className="flex items-center gap-2 mb-2"><HeartPulse className="h-5 w-5 text-[#0066FF]" /><h3 className="text-[15px] sm:text-[17px] font-bold text-[#1E293B]">{t.symptomAssistant?.recommendation?.title || "Recommendation"}</h3></div>
              <p className="text-[14px] leading-relaxed text-[#1E40AF]">{result.recommendation}</p>
            </div>
          )}

          {recommendedSpecialty && (
            <div className="rounded-[12px] bg-white p-5 sm:p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="h-5 w-5 text-[#0066FF]" />
                <h3 className="text-[15px] sm:text-[17px] font-bold text-[#1E293B]">{t.symptomAssistant?.specialist?.title || "Specialist You Need"}</h3>
              </div>
              <Link href={`/specialties/${recommendedSpecialty.slug}`} className="block rounded-[8px] p-4 transition-all hover:shadow-sm bg-[#E8F0FF] border border-[#BFDBFE]">
                <p className="text-[16px] font-bold text-[#1E293B]">{recommendedSpecialty.name}</p>
                <p className="text-[13px] mt-1 leading-relaxed text-[#475569]">{recommendedSpecialty.description}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="ds-chip-blue rounded-full px-3 py-1 text-[12px] font-semibold">
                    {t.symptomAssistant?.specialist?.doctorCount?.replace("{count}", String(recommendedSpecialty.doctorCount)) || `${recommendedSpecialty.doctorCount} doctor${recommendedSpecialty.doctorCount !== 1 ? "s" : ""} available`}
                  </span>
                  <span className="text-[13px] font-semibold text-[#0066FF]">{t.symptomAssistant?.specialist?.viewSpecialty || "View Specialty →"}</span>
                </div>
              </Link>
            </div>
          )}

          {recommendedDoctors.length > 0 && (
            <div className="rounded-[12px] bg-white p-5 sm:p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-[#0066FF]" />
                <h3 className="text-[15px] sm:text-[17px] font-bold text-[#1E293B]">{t.symptomAssistant?.doctors?.title || "Recommended Doctors"}</h3>
              </div>
              <div className="space-y-3">
                {recommendedDoctors.map((doc, i) => (
                  <Link key={i} href={`/doctors?search=${encodeURIComponent(doc.name)}`} className="block rounded-[8px] p-4 transition-all hover:shadow-sm bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[15px] font-semibold text-[#1E293B]">{doc.name}</p>
                        <p className="text-[13px] mt-1 text-[#0066FF]">{doc.specialty}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Building2 className="h-3 w-3 text-[#64748B]" />
                          <p className="text-[12px] text-[#64748B]">{doc.hospital}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-bold text-[#1E293B]">৳{doc.fee}</p>
                        <p className="text-[11px] text-[#64748B]">{t.symptomAssistant?.doctors?.consultation || "consultation"}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href={`/doctors?specialty=${encodeURIComponent(result.recommendedSpecialty)}`} className="mt-3 block text-center rounded-[8px] py-2.5 text-[13px] font-semibold transition-colors bg-[#0066FF] text-white hover:bg-[#0054D6]">
                {t.symptomAssistant?.doctors?.viewAll?.replace("{specialty}", result.recommendedSpecialty) || `View All ${result.recommendedSpecialty} Doctors →`}
              </Link>
            </div>
          )}

          {recommendedHospitals.length > 0 && (
            <div className="rounded-[12px] bg-white p-5 sm:p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-[#0066FF]" />
                <h3 className="text-[15px] sm:text-[17px] font-bold text-[#1E293B]">{t.symptomAssistant?.hospitals?.title || "Recommended Hospitals"}</h3>
              </div>
              <div className="space-y-3">
                {recommendedHospitals.map((hosp, i) => (
                  <Link key={i} href={`/hospitals?search=${encodeURIComponent(hosp.name)}`} className="block rounded-[8px] p-4 transition-all hover:shadow-sm bg-[#F8FAFC] border border-[#E2E8F0]">
                    <p className="text-[15px] font-semibold text-[#1E293B]">{hosp.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-[#64748B]" />
                      <p className="text-[12px] text-[#64748B]">{hosp.address}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {hosp.departments.filter(d => {
                        const target = result.recommendedSpecialty.toLowerCase().replace(/[^a-z]/g, "");
                        const norm = d.toLowerCase().replace(/[^a-z]/g, "");
                        return norm.includes(target) || target.includes(norm);
                      }).map((d, j) => (
                        <span key={j} className="ds-chip-blue rounded-full px-2 py-0.5 text-[11px] font-medium">{d}</span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/hospitals" className="mt-3 block text-center rounded-[8px] py-2.5 text-[13px] font-semibold transition-colors bg-white text-[#0066FF] border border-[#0066FF] hover:bg-[#F0F7FF]">
                {t.symptomAssistant?.hospitals?.viewAll || "View All Hospitals →"}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

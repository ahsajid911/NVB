"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { apiFetch } from "@/lib/api";

interface AnalysisResult { recommended: string[]; recommended_bn?: string[]; alternative: string[]; alternative_bn?: string[]; disclaimer: string; disclaimer_bn?: string; }

export default function SymptomAssistantPage() {
  const { t, language } = useLanguage();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const exampleSymptoms = [
    t.symptomAssistant.examples.chest, t.symptomAssistant.examples.head,
    t.symptomAssistant.examples.skin, t.symptomAssistant.examples.stomach,
    t.symptomAssistant.examples.joint,
  ];

  const handleAnalyze = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/symptoms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symptoms: text, lang: language }) });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ recommended: ["General Surgeon"], alternative: ["Pediatrician"], disclaimer: t.symptomAssistant.disclaimer });
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 lg:px-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#dbeafe] px-4 py-1.5 text-[14px] font-semibold text-[#2563eb] mb-5"><Sparkles className="h-4 w-4" />{t.common.aiPowered}</div>
        <h1
          className="text-[24px] sm:text-[36px] font-semibold text-[#0f172a] tracking-[-0.374px]"
          style={{ fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif' }}
        >
          {t.symptomAssistant.title}
        </h1>
        <p className="mt-4 text-[15px] sm:text-[18px] text-[#64748b]">{t.symptomAssistant.subtitle}</p>
      </div>
      <div className="rounded-2xl bg-white border border-[#e5e7eb] p-5 sm:p-7 shadow-sm">
        <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(input); }} className="space-y-5">
          <div>
            <label className="text-[14px] font-semibold text-[#475569]">{t.symptomAssistant.describeSymptoms}</label>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.symptomAssistant.placeholder} rows={4} className="mt-2 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3.5 text-[17px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none resize-none" />
          </div>
          <button type="submit" disabled={loading || !input.trim()} className="w-full rounded-full bg-[#2563eb] px-6 py-3.5 text-[17px] font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? (<><div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />{t.symptomAssistant.analyzing}</>) : (<><Search className="h-5 w-5" />{t.symptomAssistant.analyze}</>)}
          </button>
        </form>
        <div className="mt-5"><p className="text-[13px] text-[#64748b] mb-2">{t.symptomAssistant.exampleSymptoms}</p><div className="flex flex-wrap gap-2">{exampleSymptoms.map((s) => (<button key={s} onClick={() => { setInput(s); handleAnalyze(s); }} className="rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-3.5 py-1.5 text-[13px] text-[#475569] hover:border-[#2563eb]/40 hover:text-[#2563eb] hover:bg-[#eff6ff] transition-colors">{s}</button>))}</div></div>
      </div>
      {result && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-[#2563eb]/20 bg-[#eff6ff] p-6">
            <h2 className="text-[21px] font-semibold text-[#0f172a] mb-4">{t.symptomAssistant.results}</h2>
            <div className="flex flex-wrap gap-3">{(language === "bn" && result.recommended_bn ? result.recommended_bn : result.recommended).map((s) => { const slug = s.toLowerCase().replace(/\s+/g, "-"); return (<Link key={s} href={`/specialties/${slug}`} className="inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-5 py-2.5 text-[17px] font-medium text-white hover:bg-[#1d4ed8] transition-colors">{s}<ArrowRight className="h-4 w-4" /></Link>); })}</div>
          </div>
          {(language === "bn" && result.alternative_bn ? result.alternative_bn : result.alternative).length > 0 && (
            <div className="rounded-2xl bg-white border border-[#e5e7eb] p-6">
              <h2 className="text-[21px] font-semibold text-[#0f172a] mb-4">{t.symptomAssistant.alternative}</h2>
              <div className="flex flex-wrap gap-3">{(language === "bn" && result.alternative_bn ? result.alternative_bn : result.alternative).map((s) => { const slug = s.toLowerCase().replace(/\s+/g, "-"); return (<Link key={s} href={`/specialties/${slug}`} className="inline-flex items-center gap-2 rounded-full border-2 border-[#2563eb] bg-white px-5 py-2.5 text-[17px] font-medium text-[#2563eb] hover:bg-[#eff6ff] transition-colors">{s}<ArrowRight className="h-4 w-4" /></Link>); })}</div>
            </div>
          )}
          <div className="flex items-start gap-3 rounded-2xl border border-[#f59e0b]/30 bg-[#fffbeb] p-5"><AlertTriangle className="h-5 w-5 text-[#f59e0b] shrink-0 mt-0.5" /><p className="text-[14px] text-[#92400e]">{language === "bn" && result.disclaimer_bn ? result.disclaimer_bn : result.disclaimer}</p></div>
        </div>
      )}
      <div className="mt-8 sm:mt-12 rounded-2xl bg-[#f8fafc] border border-[#e5e7eb] p-5 sm:p-7">
        <h3 className="text-[18px] font-semibold text-[#0f172a] mb-3">{t.common.importantNotice}</h3>
        <ul className="space-y-2 text-[15px] text-[#64748b]">
          <li>{t.common.notMedicalDiagnosis}</li>
          <li>{t.common.noMedicationAdvice}</li>
          <li>{t.common.alwaysConsultDoctor}</li>
          <li>{t.common.emergency999}</li>
        </ul>
      </div>
    </div>
  );
}

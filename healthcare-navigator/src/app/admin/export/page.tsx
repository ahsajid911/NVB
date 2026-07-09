"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download, Users, Building2, Stethoscope, FileText, FileJson,
  Loader2, CheckCircle2, AlertCircle, Activity,
} from "lucide-react";
import { dataStore } from "@/services/dataStore";

type ExportType = "doctors" | "hospitals" | "specialties";
type ExportFormat = "csv" | "json";

interface ExportCard {
  type: ExportType;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  bgColor: string;
}

interface ExportHistoryEntry {
  id: string;
  action: string;
  resource_type: string;
  details: any;
  created_at: string;
}

const EXPORT_CARDS: ExportCard[] = [
  {
    type: "doctors",
    label: "Doctors",
    icon: <Users className="h-6 w-6" />,
    description: "Export all doctor records including qualifications, fees, and contact information.",
    color: "text-[#2563eb]",
    bgColor: "bg-[#dbeafe]",
  },
  {
    type: "hospitals",
    label: "Hospitals",
    icon: <Building2 className="h-6 w-6" />,
    description: "Export hospital data with types, departments, addresses, and phone numbers.",
    color: "text-[#16a34a]",
    bgColor: "bg-[#dcfce7]",
  },
  {
    type: "specialties",
    label: "Specialties",
    icon: <Stethoscope className="h-6 w-6" />,
    description: "Export medical specialties list with descriptions and icon references.",
    color: "text-[#d97706]",
    bgColor: "bg-[#fef3c7]",
  },
];

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convertToJSON(data: any[]): string {
  return JSON.stringify(data, null, 2);
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (Array.isArray(val)) return `"${val.join("; ")}"`;
        if (typeof val === "string" && (val.includes(",") || val.includes('"')))
          return `"${val.replace(/"/g, '""')}"`;
        return val ?? "";
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export default function AdminExportPage() {
  const [stats] = useState(dataStore.getStats());
  const [exportingType, setExportingType] = useState<ExportType | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchExportHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/logs?page=1");
      if (!res.ok) return;
      const data = await res.json();
      const exportLogs = (data.logs || []).filter(
        (log: ExportHistoryEntry) => log.action === "export"
      );
      setExportHistory(exportLogs.slice(0, 5));
    } catch {
      // silently fail
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExportHistory();
  }, [fetchExportHistory]);

  const handleExport = async (type: ExportType, format: ExportFormat) => {
    setExportingType(type);
    try {
      let exportData: any[];
      if (type === "doctors") exportData = dataStore.getDoctors();
      else if (type === "hospitals") exportData = dataStore.getHospitals();
      else exportData = dataStore.getSpecialties();

      if (exportData.length === 0) {
        showToast("error", `No ${type} data to export`);
        return;
      }

      const dateStr = getTodayString();
      const filename = `healthnav-${type}-${dateStr}.${format}`;

      if (format === "csv") {
        const csv = convertToCSV(exportData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob, filename);
      } else {
        const json = convertToJSON(exportData);
        const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
        downloadBlob(blob, filename);
      }

      showToast("success", `${type} exported as ${format.toUpperCase()} successfully`);

      fetchExportHistory();
    } catch (err) {
      console.error("Export error:", err);
      showToast("error", `Failed to export ${type}`);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-8">
        <h1
          className="text-[36px] font-semibold text-[#0f172a] sm:text-[44px] tracking-[-0.374px]"
          style={{ fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif' }}
        >
          Export Data
        </h1>
        <p className="mt-3 text-[18px] text-[#64748b]">
          Download your healthcare data in CSV or JSON format
        </p>
      </div>

      {toast && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-xl px-5 py-3.5 text-[14px] font-medium ${
            toast.type === "success"
              ? "bg-[#dcfce7] text-[#166534] border border-[#86efac]"
              : "bg-[#fef2f2] text-[#991b1b] border border-[#fca5a5]"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          )}
          {toast.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {EXPORT_CARDS.map((card) => {
          const count = stats[card.type];
          const isLoading = exportingType === card.type;
          const isEmpty = count === 0;

          return (
            <div
              key={card.type}
              className="group relative rounded-xl bg-white border border-[#e5e7eb] p-6 transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#d1d5db]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl ${card.bgColor}`}>
                  <span className={card.color}>{card.icon}</span>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[13px] font-semibold ${
                    isEmpty
                      ? "bg-[#f1f5f9] text-[#94a3b8]"
                      : "bg-[#f8fafc] text-[#475569] border border-[#e5e7eb]"
                  }`}
                >
                  {count.toLocaleString()} {count === 1 ? "record" : "records"}
                </span>
              </div>

              <h3 className="text-[18px] font-semibold text-[#0f172a] mb-2">{card.label}</h3>
              <p className="text-[14px] text-[#64748b] leading-relaxed mb-6 min-h-[42px]">
                {card.description}
              </p>

              {isEmpty ? (
                <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-[#e5e7eb] bg-[#f8fafc] py-4 px-4">
                  <p className="text-[13px] text-[#94a3b8] font-medium">No data available to export</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleExport(card.type, "csv")}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3 text-[14px] font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleExport(card.type, "json")}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-[#e5e7eb] bg-white px-4 py-3 text-[14px] font-medium text-[#475569] hover:border-[#2563eb]/40 hover:text-[#2563eb] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileJson className="h-4 w-4" />
                    )}
                    Export JSON
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white border border-[#e5e7eb] p-6">
          <h2 className="text-[17px] font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <Download className="h-5 w-5 text-[#2563eb]" />
            Format Information
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl bg-[#f8fafc] border border-[#e5e7eb] p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-[#2563eb]" />
                <h3 className="text-[14px] font-semibold text-[#0f172a]">CSV Format</h3>
              </div>
              <p className="text-[13px] text-[#64748b] leading-relaxed">
                Comma-separated values. Ideal for spreadsheet applications like Excel, Google Sheets, or data analysis tools.
                Opens directly in any spreadsheet software.
              </p>
            </div>
            <div className="rounded-xl bg-[#f8fafc] border border-[#e5e7eb] p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileJson className="h-4 w-4 text-[#d97706]" />
                <h3 className="text-[14px] font-semibold text-[#0f172a]">JSON Format</h3>
              </div>
              <p className="text-[13px] text-[#64748b] leading-relaxed">
                JavaScript Object Notation. Best for programmatic use, APIs, and importing into other applications.
                Preserves data types and nested structures.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-[#e5e7eb] p-6">
          <h2 className="text-[17px] font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#2563eb]" />
            Recent Exports
          </h2>
          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-[#f8fafc] p-3">
                  <div className="h-8 w-8 rounded-lg bg-[#e2e8f0] animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-32 rounded bg-[#e2e8f0] animate-pulse" />
                    <div className="h-3 w-20 rounded bg-[#e2e8f0] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : exportHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1f5f9] mb-3">
                <Download className="h-6 w-6 text-[#94a3b8]" />
              </div>
              <p className="text-[14px] font-medium text-[#475569] mb-1">No exports yet</p>
              <p className="text-[13px] text-[#94a3b8]">Your export history will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {exportHistory.map((entry) => {
                const details = entry.details || {};
                const resourceType = entry.resource_type || details.type || "unknown";
                const format = details.format || "csv";
                const recordCount = details.record_count ?? details.total_rows ?? "—";
                const typeLabel = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);

                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 rounded-xl bg-[#f8fafc] border border-[#f1f5f9] px-4 py-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dbeafe]">
                      <Download className="h-4 w-4 text-[#2563eb]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#0f172a] truncate">
                        {typeLabel} ({format.toUpperCase()})
                      </p>
                      <p className="text-[12px] text-[#94a3b8]">
                        {recordCount !== "—" ? `${recordCount} records` : "Exported"} &middot;{" "}
                        {formatRelativeTime(entry.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

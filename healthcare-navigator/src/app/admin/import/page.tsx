"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Papa from "papaparse";
import {
  Upload, FileText, Download, Users, Building2, Stethoscope,
  X, CheckCircle, AlertTriangle, Loader2, ChevronLeft, ChevronRight,
  Clock, FileSpreadsheet, Trash2,
} from "lucide-react";

type Tab = "doctors" | "hospitals" | "specialties";

interface ParsedRow {
  [key: string]: string;
}

interface RowValidation {
  rowIndex: number;
  valid: boolean;
  errors: { column: string; message: string }[];
}

interface ImportSummary {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
}

interface ImportHistoryEntry {
  id: string;
  date: string;
  type: Tab;
  filename: string;
  rowsImported: number;
  status: "completed" | "failed" | "partial";
}

interface LogEntry {
  id: string;
  action: string;
  resource_type: string;
  details: any;
  created_at: string;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "doctors", label: "Doctors", icon: <Users className="h-4 w-4" /> },
  { id: "hospitals", label: "Hospitals", icon: <Building2 className="h-4 w-4" /> },
  { id: "specialties", label: "Specialties", icon: <Stethoscope className="h-4 w-4" /> },
];

const DEMO_HEADERS: Record<Tab, string[]> = {
  doctors: [
    "name", "specialty", "hospital", "district", "gender",
    "fee", "phone", "email", "available_days", "available_times",
  ],
  hospitals: [
    "name", "address", "district", "type", "phone",
    "email", "website", "departments", "emergency_services", "rating",
  ],
  specialties: ["name", "slug", "description", "icon"],
};

const DEMO_ROWS: Record<Tab, string[][]> = {
  doctors: [
    [
      "Dr. Ahsan Rahman", "Cardiology", "Square Hospital", "Dhaka",
      "male", "1500", "+880-1711-001234", "ahsan@example.com",
      "Sunday,Monday,Tuesday,Wednesday,Thursday", "09:00-17:00",
    ],
    [
      "Dr. Fatima Khan", "Neurology", "United Hospital", "Dhaka",
      "female", "2000", "+880-1812-005678", "fatima@example.com",
      "Sunday,Monday,Wednesday,Friday", "10:00-16:00",
    ],
    [
      "Dr. Rafiq Hasan", "Orthopedics", "Apollo Hospitals", "Chittagong",
      "male", "1200", "+880-1913-009012", "rafiq@example.com",
      "Sunday,Tuesday,Thursday", "08:00-14:00",
    ],
  ],
  hospitals: [
    [
      "Square Hospital", "18/F, Green Road, Dhaka 1205", "Dhaka",
      "private", "+880-2-8144400", "info@squarehospital.com",
      "https://squarehospital.com", "Cardiology,Neurology,Orthopedics",
      "Yes", "4.5",
    ],
    [
      "Chittagong Medical College Hospital", "Chittagong Medical College Road", "Chittagong",
      "government", "+880-31-611584", "info@cmc.gov.bd",
      "", "General Surgery,Pediatrics,ENT",
      "Yes", "3.8",
    ],
  ],
  specialties: [
    ["Cardiology", "cardiology", "Diagnosis and treatment of heart disorders", "heart-pulse"],
    ["Neurology", "neurology", "Disorders of the nervous system", "brain"],
    ["Orthopedics", "orthopedics", "Musculoskeletal system conditions", "bone"],
  ],
};

function generateDemoCSV(tab: Tab): string {
  const headers = DEMO_HEADERS[tab];
  const rows = DEMO_ROWS[tab];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(row.map((v) => (v.includes(",") ? `"${v}"` : v)).join(","));
  }
  return lines.join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function validateRows(rows: ParsedRow[], tab: Tab): RowValidation[] {
  return rows.map((row, index) => {
    const errors: { column: string; message: string }[] = [];

    if (tab === "doctors") {
      if (!row.name?.trim()) errors.push({ column: "name", message: "Name is required" });
      if (!row.specialty?.trim()) errors.push({ column: "specialty", message: "Specialty is required" });
      const fee = parseFloat(row.fee);
      if (isNaN(fee) || fee <= 0) errors.push({ column: "fee", message: "Fee must be a positive number" });
    } else if (tab === "hospitals") {
      if (!row.name?.trim()) errors.push({ column: "name", message: "Name is required" });
      if (!row.district?.trim()) errors.push({ column: "district", message: "District is required" });
    } else {
      if (!row.name?.trim()) errors.push({ column: "name", message: "Name is required" });
    }

    return { rowIndex: index, valid: errors.length === 0, errors };
  });
}

function detectDuplicates(rows: ParsedRow[], tab: Tab): Set<number> {
  const seen = new Map<string, number>();
  const duplicates = new Set<number>();

  rows.forEach((row, index) => {
    let key = "";
    if (tab === "doctors") key = `${row.name?.toLowerCase()}-${row.specialty?.toLowerCase()}`;
    else if (tab === "hospitals") key = `${row.name?.toLowerCase()}-${row.district?.toLowerCase()}`;
    else key = row.slug?.toLowerCase() || row.name?.toLowerCase();

    if (seen.has(key)) duplicates.add(index);
    else seen.set(key, index);
  });

  return duplicates;
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  const m = minutes.toString().padStart(2, "0");
  return `${month} ${day}, ${year} at ${h}:${m} ${ampm}`;
}

export default function ImportCenterPage() {
  const [activeTab, setActiveTab] = useState<Tab>("doctors");
  const [csvData, setCsvData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<{ count: number; tab: Tab } | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistoryEntry[]>([]);
  const [previewPage, setPreviewPage] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const PREVIEW_PAGE_SIZE = 10;

  const validation = useMemo(() => validateRows(csvData, activeTab), [csvData, activeTab]);
  const duplicates = useMemo(() => detectDuplicates(csvData, activeTab), [csvData, activeTab]);

  const summary: ImportSummary = useMemo(() => {
    const validRows = validation.filter((v) => v.valid);
    const validWithoutDuplicates = validRows.filter((v) => !duplicates.has(v.rowIndex));
    return {
      total: csvData.length,
      valid: validWithoutDuplicates.length,
      invalid: csvData.length - validWithoutDuplicates.length,
      duplicates: duplicates.size,
    };
  }, [validation, duplicates, csvData.length]);

  const totalPages = Math.max(1, Math.ceil(csvData.length / PREVIEW_PAGE_SIZE));
  const previewRows = csvData.slice(
    (previewPage - 1) * PREVIEW_PAGE_SIZE,
    previewPage * PREVIEW_PAGE_SIZE
  );
  const previewValidation = validation.slice(
    (previewPage - 1) * PREVIEW_PAGE_SIZE,
    previewPage * PREVIEW_PAGE_SIZE
  );

  useEffect(() => {
    setPreviewPage(1);
  }, [csvData]);

  useEffect(() => {
    fetchImportHistory();
  }, []);

  const fetchImportHistory = async () => {
    try {
      const res = await fetch("/api/admin/logs?page=1");
      if (!res.ok) return;
      const data = await res.json();
      const importLogs = (data.logs || [])
        .filter((log: LogEntry) => log.action === "import")
        .slice(0, 10)
        .map((log: LogEntry) => ({
          id: log.id,
          date: log.created_at,
          type: (log.resource_type as Tab) || "doctors",
          filename: log.details?.filename || "Unknown",
          rowsImported: log.details?.rows_imported || 0,
          status: (log.details?.status as "completed" | "failed" | "partial") || "completed",
        }));
      setImportHistory(importLogs);
    } catch {
    }
  };

  const parseCSV = useCallback((text: string) => {
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, "_"),
    });

    if (result.errors.length > 0) {
      setErrors(result.errors.slice(0, 5).map((e: any) => `Row ${e.row}: ${e.message}`));
    } else {
      setErrors([]);
    }

    const parsed = (result.data as ParsedRow[]).map((row) => {
      const trimmed: ParsedRow = {};
      for (const [key, value] of Object.entries(row)) {
        trimmed[key.trim()] = typeof value === "string" ? value.trim() : value;
      }
      return trimmed;
    });
    if (parsed.length > 0) {
      setHeaders(Object.keys(parsed[0]));
    } else {
      setHeaders([]);
    }
    setCsvData(parsed);
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv") && !file.type.includes("csv")) {
      setErrors(["Please select a valid CSV file"]);
      return;
    }
    setFileName(file.name);
    setImportSuccess(null);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) parseCSV(text);
    };
    reader.readAsText(file);
  }, [parseCSV]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  };

  const handleDownloadDemo = () => {
    const csv = generateDemoCSV(activeTab);
    downloadCSV(csv, `${activeTab}_import_demo.csv`);
  };

  const handleImport = async () => {
    if (summary.valid === 0) return;
    setImporting(true);
    setErrors([]);

    try {
      const validRows = csvData.filter((_, i) => {
        const v = validation[i];
        return v.valid && !duplicates.has(i);
      });

      const rowsToImport = validRows.map((row) => {
        if (activeTab === "specialties" && !row.slug?.trim()) {
          return { ...row, slug: row.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") };
        }
        return row;
      });

      const csvContent = Papa.unparse(rowsToImport);
      const blob = new Blob([csvContent], { type: "text/csv" });
      const file = new File([blob], fileName || `${activeTab}_import.csv`, { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", activeTab);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Import failed");

      setImportSuccess({ count: rowsToImport.length, tab: activeTab });
      fetchImportHistory();

      setTimeout(() => setImportSuccess(null), 8000);
    } catch (err: any) {
      setErrors([err.message || "Import failed. Please try again."]);
    } finally {
      setImporting(false);
    }
  };

  const handleClearFile = () => {
    setCsvData([]);
    setHeaders([]);
    setFileName("");
    setErrors([]);
    setImportSuccess(null);
    setPreviewPage(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getTabColor = (tab: Tab) => {
    switch (tab) {
      case "doctors": return { bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]" };
      case "hospitals": return { bg: "bg-[#dcfce7]", text: "text-[#15803d]" };
      case "specialties": return { bg: "bg-[#fef3c7]", text: "text-[#92400e]" };
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
      <div className="mb-8">
        <h1
          className="text-[36px] font-semibold text-[#0f172a] sm:text-[44px] tracking-[-0.374px]"
          style={{ fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif' }}
        >
          Import Center
        </h1>
        <p className="mt-3 text-[18px] text-[#64748b]">Bulk import doctors, hospitals, and specialties from CSV files</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              handleClearFile();
            }}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#2563eb] text-white"
                : "bg-white border border-[#e5e7eb] text-[#64748b] hover:bg-[#f8fafc]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Success Banner */}
      {importSuccess && importSuccess.tab === activeTab && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-[#dcfce7] border border-[#86efac] px-5 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-[#16a34a]" />
            <p className="text-[14px] font-medium text-[#166534]">
              Successfully imported {importSuccess.count} {activeTab} record{importSuccess.count !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={() => setImportSuccess(null)} className="text-[#16a34a] hover:text-[#166534]">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Import Area */}
        <div className="xl:col-span-2 space-y-6">
          {/* Download Demo & Upload */}
          <div className="rounded-2xl bg-white border border-[#e5e7eb] p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[21px] font-semibold text-[#0f172a] flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#2563eb]" />
                Upload CSV
              </h2>
              <button
                onClick={handleDownloadDemo}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#e5e7eb] bg-white px-5 py-2.5 text-[13px] font-medium text-[#475569] hover:border-[#2563eb]/40 hover:text-[#2563eb] transition-colors"
              >
                <Download className="h-4 w-4" />
                Download Demo CSV
              </button>
            </div>

            {/* Expected Format */}
            <div className="rounded-xl bg-[#eff6ff] border border-[#bfdbfe] p-4 mb-6">
              <p className="text-[13px] font-semibold text-[#1e40af] mb-2">Expected CSV columns for {activeTab}:</p>
              <div className="flex flex-wrap gap-2">
                {DEMO_HEADERS[activeTab].map((h) => (
                  <span key={h} className="inline-flex items-center rounded-full bg-[#dbeafe] px-2.5 py-1 text-[12px] font-medium text-[#1e40af]">
                    {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all ${
                isDragOver
                  ? "border-[#2563eb] bg-[#eff6ff]"
                  : fileName
                    ? "border-[#86efac] bg-[#f0fdf4]"
                    : "border-[#d1d5db] bg-[#f8fafc] hover:border-[#93c5fd] hover:bg-[#eff6ff]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                className="hidden"
              />
              {fileName ? (
                <>
                  <FileText className="h-10 w-10 text-[#16a34a] mb-3" />
                  <p className="text-[15px] font-medium text-[#0f172a] mb-1">{fileName}</p>
                  <p className="text-[13px] text-[#64748b] mb-4">{csvData.length} rows detected</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearFile();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#fef2f2] px-3 py-1.5 text-[12px] font-medium text-[#dc2626] hover:bg-[#fecaca] transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-[#94a3b8] mb-3" />
                  <p className="text-[15px] font-medium text-[#0f172a] mb-1">Drop CSV file here</p>
                  <p className="text-[13px] text-[#64748b] mb-4">or click to browse files</p>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-4 py-2 text-[13px] font-medium text-white">
                    <FileText className="h-3.5 w-3.5" />
                    Browse CSV
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="rounded-2xl bg-[#fef2f2] border border-[#fca5a5] p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-[#dc2626]" />
                <p className="text-[14px] font-semibold text-[#991b1b]">
                  {errors.length} Error{errors.length > 1 ? "s" : ""} Found
                </p>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {errors.map((err, i) => (
                  <p key={i} className="text-[13px] text-[#991b1b]">{err}</p>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {csvData.length > 0 && (
            <div className="rounded-2xl bg-white border border-[#e5e7eb] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-[#f8fafc]">
                <h3 className="text-[16px] font-semibold text-[#0f172a]">
                  Preview
                  <span className="ml-2 text-[13px] font-normal text-[#64748b]">
                    ({csvData.length} rows)
                  </span>
                </h3>
                <span className="text-[13px] text-[#64748b]">
                  Showing rows {(previewPage - 1) * PREVIEW_PAGE_SIZE + 1}–
                  {Math.min(previewPage * PREVIEW_PAGE_SIZE, csvData.length)} of {csvData.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#f8fafc] border-b border-[#e5e7eb]">
                    <tr>
                      <th className="px-4 py-3 text-[12px] font-semibold text-[#64748b] uppercase tracking-wider w-12">
                        #
                      </th>
                      {headers.map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-[12px] font-semibold text-[#64748b] uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-[12px] font-semibold text-[#64748b] uppercase tracking-wider w-20">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {previewRows.map((row, i) => {
                      const absoluteIndex = (previewPage - 1) * PREVIEW_PAGE_SIZE + i;
                      const v = previewValidation[i];
                      const isDuplicate = duplicates.has(absoluteIndex);
                      const rowBg = !v.valid
                        ? "bg-[#fef2f2]/50"
                        : isDuplicate
                          ? "bg-[#fffbeb]/50"
                          : "hover:bg-[#f8fafc]";

                      return (
                        <tr key={absoluteIndex} className={rowBg}>
                          <td className="px-4 py-3 text-[12px] text-[#94a3b8] font-mono">
                            {absoluteIndex + 2}
                          </td>
                          {headers.map((h) => (
                            <td
                              key={h}
                              className="px-4 py-3 text-[13px] text-[#0f172a] max-w-[200px] truncate"
                              title={row[h] || ""}
                            >
                              {row[h] || <span className="text-[#d1d5db]">—</span>}
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            {!v.valid ? (
                              <span className="inline-flex items-center rounded-full bg-[#fef2f2] px-2 py-0.5 text-[11px] font-semibold text-[#dc2626]">
                                Error
                              </span>
                            ) : isDuplicate ? (
                              <span className="inline-flex items-center rounded-full bg-[#fffbeb] px-2 py-0.5 text-[11px] font-semibold text-[#d97706]">
                                Duplicate
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-2 py-0.5 text-[11px] font-semibold text-[#16a34a]">
                                Valid
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#e5e7eb] bg-[#f8fafc] px-6 py-3">
                  <button
                    onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                    disabled={previewPage <= 1}
                    className="flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-[12px] font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </button>
                  <span className="text-[12px] text-[#64748b]">
                    Page {previewPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPreviewPage((p) => Math.min(totalPages, p + 1))}
                    disabled={previewPage >= totalPages}
                    className="flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-[12px] font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Row-level Errors */}
              {validation.some((v) => !v.valid) && (
                <div className="border-t border-[#e5e7eb] bg-[#fef2f2] px-6 py-4">
                  <p className="text-[13px] font-semibold text-[#991b1b] mb-2">Row Errors:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {validation
                      .filter((v) => !v.valid)
                      .slice(0, 15)
                      .map((v) => (
                        <div key={v.rowIndex} className="text-[12px] text-[#991b1b]">
                          <span className="font-semibold">Row {v.rowIndex + 2}:</span>{" "}
                          {v.errors.map((e) => `${e.column}: ${e.message}`).join(", ")}
                        </div>
                      ))}
                    {validation.filter((v) => !v.valid).length > 15 && (
                      <p className="text-[12px] text-[#991b1b] italic">
                        ...and {validation.filter((v) => !v.valid).length - 15} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Summary & Button */}
          {csvData.length > 0 && (
            <div className="rounded-2xl bg-white border border-[#e5e7eb] p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl bg-[#f8fafc] border border-[#e5e7eb] p-4 text-center">
                  <p className="text-[28px] font-bold text-[#0f172a]">{summary.total}</p>
                  <p className="text-[12px] font-medium text-[#64748b] mt-1">Total Rows</p>
                </div>
                <div className="rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] p-4 text-center">
                  <p className="text-[28px] font-bold text-[#16a34a]">{summary.valid}</p>
                  <p className="text-[12px] font-medium text-[#166534] mt-1">Valid</p>
                </div>
                <div className="rounded-xl bg-[#fef2f2] border border-[#fecaca] p-4 text-center">
                  <p className="text-[28px] font-bold text-[#dc2626]">{summary.invalid - summary.duplicates}</p>
                  <p className="text-[12px] font-medium text-[#991b1b] mt-1">Invalid</p>
                </div>
                <div className="rounded-xl bg-[#fffbeb] border border-[#fde68a] p-4 text-center">
                  <p className="text-[28px] font-bold text-[#d97706]">{summary.duplicates}</p>
                  <p className="text-[12px] font-medium text-[#92400e] mt-1">Duplicates</p>
                </div>
              </div>

              <button
                onClick={handleImport}
                disabled={summary.valid === 0 || importing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-6 py-3.5 text-[16px] font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Import {summary.valid} {activeTab}
                  </>
                )}
              </button>
              {summary.valid === 0 && csvData.length > 0 && (
                <p className="mt-2 text-center text-[13px] text-[#dc2626]">
                  No valid rows to import. Fix the errors above first.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Import History */}
        <div className="xl:col-span-1">
          <div className="rounded-2xl bg-white border border-[#e5e7eb] overflow-hidden sticky top-6">
            <div className="px-6 py-5 border-b border-[#e5e7eb] bg-[#f8fafc]">
              <h3 className="text-[16px] font-semibold text-[#0f172a] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#2563eb]" />
                Import History
              </h3>
              <p className="text-[12px] text-[#64748b] mt-1">Last 10 imports</p>
            </div>

            {importHistory.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <FileSpreadsheet className="h-8 w-8 text-[#d1d5db] mx-auto mb-3" />
                <p className="text-[13px] text-[#64748b]">No imports yet</p>
                <p className="text-[12px] text-[#94a3b8] mt-1">Import data to see history here</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f1f5f9]">
                {importHistory.map((entry) => {
                  const colors = getTabColor(entry.type);
                  return (
                    <div key={entry.id} className="px-6 py-4 hover:bg-[#f8fafc] transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${colors.bg} ${colors.text}`}>
                          {entry.type}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            entry.status === "completed"
                              ? "bg-[#dcfce7] text-[#16a34a]"
                              : entry.status === "failed"
                                ? "bg-[#fef2f2] text-[#dc2626]"
                                : "bg-[#fef3c7] text-[#d97706]"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                      <p className="text-[13px] font-medium text-[#0f172a] truncate">{entry.filename}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[12px] text-[#64748b]">
                          {entry.rowsImported.toLocaleString()} rows
                        </span>
                        <span className="text-[11px] text-[#94a3b8]">
                          {formatDateTime(entry.date)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t border-[#e5e7eb] bg-[#f8fafc] px-6 py-3">
              <button
                onClick={fetchImportHistory}
                className="w-full text-center text-[12px] font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
              >
                Refresh history
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

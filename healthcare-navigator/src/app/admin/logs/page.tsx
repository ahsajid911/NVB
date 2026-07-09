"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft, ChevronRight, RefreshCw, ChevronDown, ChevronUp,
  ClipboardList, Loader2, Clock, Globe, Search, X,
} from "lucide-react";

interface LogAdmin {
  username: string;
  email: string;
}

interface LogEntry {
  id: string;
  admin_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  created_at: string;
  admins: LogAdmin;
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
}

type ActionFilter = "all" | "login" | "create" | "update" | "delete" | "import";

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  login: { bg: "bg-[#dcfce7]", text: "text-[#166534]" },
  logout: { bg: "bg-[#f1f5f9]", text: "text-[#64748b]" },
  create: { bg: "bg-[#dbeafe]", text: "text-[#1e40af]" },
  update: { bg: "bg-[#fef3c7]", text: "text-[#92400e]" },
  delete: { bg: "bg-[#fef2f2]", text: "text-[#991b1b]" },
  import: { bg: "bg-[#f3e8ff]", text: "text-[#6b21a8]" },
  export: { bg: "bg-[#f3e8ff]", text: "text-[#6b21a8]" },
  password_changed: { bg: "bg-[#fff7ed]", text: "text-[#9a3412]" },
};

const ACTION_FILTERS: { value: ActionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "login", label: "Login" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "import", label: "Import" },
];

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
  if (days < 7) return `${days}d ago`;
  return formatAbsoluteTime(dateStr);
}

function formatAbsoluteTime(dateStr: string): string {
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

function isRecent(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 7 * 24 * 60 * 60 * 1000;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[#f1f5f9]">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className={`h-4 rounded bg-[#f1f5f9] animate-pulse ${i === 0 ? "w-28" : i === 5 ? "w-24" : "w-full"}`} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const LIMIT = 20;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const fetchLogs = useCallback(async (pageNum: number) => {
    try {
      const res = await fetch(`/api/admin/logs?page=${pageNum}`);
      if (!res.ok) return;
      const data: LogsResponse = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchLogs(page);
  }, [page, fetchLogs]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchLogs(page);
      }, 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, page, fetchLogs]);

  const filteredLogs = actionFilter === "all"
    ? logs
    : logs.filter((log) => log.action === actionFilter);

  const toggleRow = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-8">
        <h1
          className="text-[36px] font-semibold text-[#0f172a] sm:text-[44px] tracking-[-0.374px]"
          style={{ fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif' }}
        >
          Activity Logs
        </h1>
        <p className="mt-3 text-[18px] text-[#64748b]">Monitor all admin actions and changes</p>
      </div>

      <div className="rounded-2xl bg-white border border-[#e5e7eb] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-3 py-1.5">
              <Search className="h-4 w-4 text-[#94a3b8]" />
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value as ActionFilter); setPage(1); }}
                className="bg-transparent text-[13px] font-medium text-[#0f172a] focus:outline-none cursor-pointer appearance-none pr-2"
              >
                {ACTION_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-[#94a3b8]" />
            </div>
            <span className="text-[13px] text-[#94a3b8]">
              {total.toLocaleString()} total logs
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                autoRefresh
                  ? "bg-[#2563eb] text-white"
                  : "bg-[#f8fafc] border border-[#e5e7eb] text-[#64748b] hover:bg-[#f1f5f9]"
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh ? "animate-spin" : ""}`} />
              {autoRefresh ? "Auto-refresh on" : "Auto-refresh"}
            </button>
            <button
              onClick={() => { setLoading(true); fetchLogs(page); }}
              className="flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-4 py-2 text-[13px] font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f8fafc]">
                  {["Timestamp", "Admin", "Action", "Resource", "Details", "IP Address"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[12px] font-semibold text-[#64748b] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f1f5f9] mb-5">
              <ClipboardList className="h-8 w-8 text-[#94a3b8]" />
            </div>
            <p className="text-[17px] font-medium text-[#0f172a] mb-1">No activity logs found</p>
            <p className="text-[14px] text-[#64748b]">
              {actionFilter !== "all"
                ? "Try changing the filter to see more results"
                : "Activity will appear here as admins perform actions"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f8fafc]">
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#64748b] uppercase tracking-wider">Timestamp</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#64748b] uppercase tracking-wider">Admin</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#64748b] uppercase tracking-wider">Action</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#64748b] uppercase tracking-wider">Resource Type</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#64748b] uppercase tracking-wider">Details</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#64748b] uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredLogs.map((log) => {
                  const colors = ACTION_COLORS[log.action] || { bg: "bg-[#f1f5f9]", text: "text-[#64748b]" };
                  const hasDetails = log.details && Object.keys(log.details).length > 0;
                  const isExpanded = expandedRow === log.id;
                  const recent = isRecent(log.created_at);

                  return (
                    <tr key={log.id} className="hover:bg-[#f8fafc]/60 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
                          <span className="text-[13px] text-[#0f172a]" title={formatAbsoluteTime(log.created_at)}>
                            {recent ? formatRelativeTime(log.created_at) : formatAbsoluteTime(log.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="min-w-0">
                          <p className="text-[14px] font-medium text-[#0f172a] truncate max-w-[180px]">
                            {log.admins?.username || "Unknown"}
                          </p>
                          {log.admins?.email && (
                            <p className="text-[12px] text-[#94a3b8] truncate max-w-[180px]">
                              {log.admins.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold capitalize ${colors.bg} ${colors.text}`}>
                          {log.action.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[13px] text-[#475569] capitalize">
                          {log.resource_type?.replace("_", " ") || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {hasDetails ? (
                          <button
                            onClick={() => toggleRow(log.id)}
                            className="flex items-center gap-1.5 text-[13px] text-[#2563eb] hover:text-[#1d4ed8] font-medium transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            View
                          </button>
                        ) : (
                          <span className="text-[13px] text-[#94a3b8]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[13px] text-[#64748b] font-mono bg-[#f8fafc] px-2 py-0.5 rounded border border-[#e5e7eb]">
                          {log.ip_address || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {expandedRow && (() => {
              const log = filteredLogs.find((l) => l.id === expandedRow);
              if (!log || !log.details || Object.keys(log.details).length === 0) return null;
              return (
                <div className="border-t border-[#e5e7eb] bg-[#f8fafc] px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[13px] font-semibold text-[#0f172a]">
                      Details for action: {log.action.replace("_", " ")}
                    </p>
                    <button onClick={() => setExpandedRow(null)} className="text-[#94a3b8] hover:text-[#64748b]">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <pre className="text-[12px] text-[#475569] font-mono bg-white rounded-xl border border-[#e5e7eb] p-4 overflow-x-auto whitespace-pre-wrap max-h-64">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              );
            })()}
          </div>
        )}

        {!loading && filteredLogs.length > 0 && (
          <div className="flex items-center justify-between border-t border-[#e5e7eb] bg-[#f8fafc] px-6 py-4">
            <span className="text-[13px] text-[#64748b]">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-[13px] font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-[13px] font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { Upload, Download, FileText, Users, Building2, Stethoscope, BarChart3 } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";

interface AdminOverviewProps {
  stats: { doctors: number; hospitals: number; specialties: number; districts: number };
  onRefresh: () => void;
}

export function AdminOverview({ stats, onRefresh }: AdminOverviewProps) {
  const [importType, setImportType] = useState<"doctors" | "hospitals" | "specialties">("doctors");
  const [importResult, setImportResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const demoCSVData: Record<string, { headers: string; rows: string }> = {
    doctors: {
      headers: "name,qualifications,experience_years,consultation_fee,gender,contact_phone,chamber_address,name_bn,qualifications_bn,chamber_address_bn,bio,bio_bn",
      rows: [
        "Dr. John Doe,MBBS MD Cardiology,10,1500,male,+880-1711-001,Square Hospital Room 512 Dhaka,ডঃ জন ডো,এমবিবিএস এমডি কার্ডিওলজি,স্কয়ার হাসপাতাল রুম ৫১২ ঢাকা,Senior cardiologist,সিনিয়র কার্ডিওলজিস্ট",
      ].join("\n"),
    },
    hospitals: {
      headers: "name,district_id,type,address,contact_phone,departments,name_bn,address_bn,departments_bn",
      rows: [
        "City Hospital,1,private,Main Road Dhaka 1205,+880-2-8144400,Cardiology;Neurology;Orthopedics,সিটি হাসপাতাল,মূল সড়ক ঢাকা ১২০৫,কার্ডিওলজি;নিউরোলজি;অর্থোপেডিক্স",
      ].join("\n"),
    },
    specialties: {
      headers: "name,description,icon,name_bn,description_bn",
      rows: [
        "Rheumatologist,Treats autoimmune and joint diseases like arthritis,bone,বাতবিশেষজ্ঞ,বাত ও জয়েন্ট রোগ চিকিৎসা করেন",
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

  const handleImport = async () => {
    if (!fileRef.current?.files?.[0]) return;
    setLoading(true);
    const file = fileRef.current.files[0];
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      const rows = lines.slice(1);
      let imported = 0, skipped = 0;
      const errors: string[] = [];
      rows.forEach((row, i) => {
        try {
          const values = row.split(",");
          if (values.length < 2) { skipped++; errors.push(`Row ${i + 2}: insufficient columns`); return; }
          imported++;
        } catch { skipped++; errors.push(`Row ${i + 2}: parsing error`); }
      });
      setImportResult({ type: importType, filename: file.name, totalRows: rows.length, imported, skipped, errors: errors.slice(0, 10) });
    } catch { setImportResult({ type: importType, filename: file.name, totalRows: 0, imported: 0, skipped: 0, errors: ["Failed to parse CSV"] }); }
    setLoading(false);
  };

  const handleExport = (type: string, data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => {
        const val = row[h];
        if (Array.isArray(val)) return `"${val.join("; ")}"`;
        if (typeof val === "string" && val.includes(",")) return `"${val}"`;
        return val ?? "";
      }).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Doctors" value={stats.doctors} color="bg-primary/10 text-primary" />
        <StatCard icon={Building2} label="Hospitals" value={stats.hospitals} color="bg-success/10 text-success" />
        <StatCard icon={Stethoscope} label="Specialties" value={stats.specialties} color="bg-warning/10 text-warning" />
        <StatCard icon={BarChart3} label="Districts" value={stats.districts} color="bg-purple-500/10 text-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Import CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data Type</label>
              <Select value={importType} onChange={(e) => setImportType(e.target.value as any)}>
                <option value="doctors">Doctors</option>
                <option value="hospitals">Hospitals</option>
                <option value="specialties">Specialties</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">CSV File</label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleImport} disabled={loading} className="flex-1">
                {loading ? "Importing..." : "Import Data"}
              </Button>
              <Button onClick={handleDownloadDemo} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Demo CSV
              </Button>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-xs font-medium text-foreground mb-2">Expected CSV Format for {importType}:</p>
              <pre className="text-xs text-muted-foreground font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {getDemoCSVPreview()}
              </pre>
            </div>
            {importResult && (
              <div className="rounded-lg bg-muted p-4 space-y-1">
                <h4 className="text-sm font-medium">Import Report</h4>
                <p className="text-sm text-muted-foreground">File: {importResult.filename}</p>
                <p className="text-sm text-muted-foreground">Total rows: {importResult.totalRows}</p>
                <p className="text-sm text-success font-medium">Imported: {importResult.imported}</p>
                <p className="text-sm text-warning font-medium">Skipped: {importResult.skipped}</p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-destructive font-medium">Errors:</p>
                    {importResult.errors.map((e: string, i: number) => (
                      <p key={i} className="text-xs text-destructive">{e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export your healthcare data in CSV format for backup or analysis.
            </p>
            <Button onClick={onRefresh} variant="outline" className="w-full">
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

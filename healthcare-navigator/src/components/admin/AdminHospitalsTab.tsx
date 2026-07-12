"use client";

import { useState } from "react";
import { Plus, Trash2, Search, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiFetch } from "@/lib/api";

interface AdminHospitalsTabProps {
  hospitals: any[];
  loading: boolean;
  onRefresh: () => void;
}

type Action = "view" | "add-single" | "add-multi" | "delete-single" | "delete-multi";

export function AdminHospitalsTab({ hospitals, loading, onRefresh }: AdminHospitalsTabProps) {
  const [action, setAction] = useState<Action>("view");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newHospital, setNewHospital] = useState({
    name: "", name_bn: "", district_id: "1", type: "private" as const,
    address: "", address_bn: "", contact_phone: "", contact_email: "",
    departments: "", departments_bn: ""
  });
  const [multiText, setMultiText] = useState("");

  const filtered = searchQuery
    ? hospitals.filter((h) => h.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : hospitals;

  const handleDelete = async (ids: string[]) => {
    try {
      const res = await apiFetch("/api/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "hospitals", ids }),
      });
      if (res.ok) { setSelected([]); onRefresh(); }
    } catch {}
    setDeleteId(null);
  };

  const handleAdd = async () => {
    if (!newHospital.name.trim()) return;
    setSubmitting(true);
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
        setAction("view");
        onRefresh();
      }
    } catch {}
    setSubmitting(false);
  };

  const handleAddMulti = async () => {
    const lines = multiText.split("\n").filter((l) => l.trim());
    if (lines.length === 0) return;
    setSubmitting(true);
    const items = lines.map((line) => {
      const [name, district_id, type, address, contact_phone, departments, name_bn, address_bn, departments_bn] = line.split(",").map((s) => s.trim());
      return {
        name: name || "", name_bn: name_bn || "", district_id: district_id || "1",
        type: type === "government" ? "government" : "private", address: address || "",
        address_bn: address_bn || "", contact_phone: contact_phone || "", contact_email: null,
        website: null,
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
      if (res.ok) { setMultiText(""); setAction("view"); onRefresh(); }
    } catch {}
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["view", "add-single", "add-multi", "delete-single", "delete-multi"] as Action[]).map((a) => (
          <Button key={a} variant={action === a ? "default" : "outline"} size="sm" onClick={() => { setAction(a); setSearchQuery(""); }}>
            {a === "view" && <Search className="h-4 w-4 mr-1" />}
            {(a === "add-single" || a === "add-multi") && <Plus className="h-4 w-4 mr-1" />}
            {(a === "delete-single" || a === "delete-multi") && <Trash2 className="h-4 w-4 mr-1" />}
            {a.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </Button>
        ))}
      </div>

      {(action === "view" || action === "delete-single" || action === "delete-multi") && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search hospitals..." className="pl-9" />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : action === "view" ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Phone</th>
                    <th className="px-4 py-3 text-left font-medium">Departments</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((hosp) => (
                    <tr key={hosp.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{hosp.name}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 rounded-full bg-muted text-xs capitalize">{hosp.type}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{hosp.contact_phone}</td>
                      <td className="px-4 py-3">{Array.isArray(hosp.departments) ? hosp.departments.length : 0} depts</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">No hospitals found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : action === "add-single" ? (
        <Card>
          <CardHeader><CardTitle>Add New Hospital</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name (EN) *</label>
                <Input value={newHospital.name} onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })} placeholder="Hospital Name" />
              </div>
              <div>
                <label className="text-sm font-medium">Name (BN)</label>
                <Input value={newHospital.name_bn} onChange={(e) => setNewHospital({ ...newHospital, name_bn: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input value={newHospital.contact_phone} onChange={(e) => setNewHospital({ ...newHospital, contact_phone: e.target.value })} placeholder="+880-..." />
              </div>
              <div>
                <label className="text-sm font-medium">Departments (comma separated)</label>
                <Input value={newHospital.departments} onChange={(e) => setNewHospital({ ...newHospital, departments: e.target.value })} placeholder="Cardiology, Neurology" />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={submitting}>{submitting ? "Adding..." : "Add Hospital"}</Button>
          </CardContent>
        </Card>
      ) : action === "add-multi" ? (
        <Card>
          <CardHeader><CardTitle>Add Multiple Hospitals</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">One hospital per line. Format: Name, DistrictID, Type, Address, Phone, Departments(semi-colon), Name_BN, Address_BN, Departments_BN(semi-colon)</p>
            <textarea value={multiText} onChange={(e) => setMultiText(e.target.value)} rows={8} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" />
            <Button onClick={handleAddMulti} disabled={submitting}>{submitting ? "Adding..." : "Add All"}</Button>
          </CardContent>
        </Card>
      ) : action === "delete-multi" ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-destructive">Select items and click delete. This cannot be undone.</p>
              <Button variant="destructive" size="sm" disabled={selected.length === 0} onClick={() => handleDelete(selected)}>
                Delete Selected ({selected.length})
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <button onClick={() => { const allIds = filtered.map((h) => h.id); setSelected(allIds.length === selected.length ? [] : allIds); }}>
                        {filtered.length > 0 && filtered.length === selected.length ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((hosp) => (
                    <tr key={hosp.id} className={`border-b last:border-0 cursor-pointer ${selected.includes(hosp.id) ? "bg-muted/50" : ""}`} onClick={() => setSelected((prev) => prev.includes(hosp.id) ? prev.filter((i) => i !== hosp.id) : [...prev, hosp.id])}>
                      <td className="px-4 py-3">{selected.includes(hosp.id) ? <CheckSquare className="h-5 w-5 text-destructive" /> : <Square className="h-5 w-5 text-muted-foreground" />}</td>
                      <td className="px-4 py-3 font-medium">{hosp.name}</td>
                      <td className="px-4 py-3 capitalize">{hosp.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} title="Delete Hospital" description="Are you sure you want to delete this hospital?" onConfirm={() => deleteId && handleDelete([deleteId])} />
    </div>
  );
}

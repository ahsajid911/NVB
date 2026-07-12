"use client";

import { useState } from "react";
import { Plus, Trash2, Search, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiFetch } from "@/lib/api";

interface AdminSpecialtiesTabProps {
  specialties: any[];
  loading: boolean;
  onRefresh: () => void;
}

type Action = "view" | "add-single" | "add-multi" | "delete-single" | "delete-multi";

export function AdminSpecialtiesTab({ specialties, loading, onRefresh }: AdminSpecialtiesTabProps) {
  const [action, setAction] = useState<Action>("view");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newSpecialty, setNewSpecialty] = useState({ name: "", name_bn: "", slug: "", description: "", description_bn: "", icon: "stethoscope" });
  const [multiText, setMultiText] = useState("");

  const filtered = searchQuery
    ? specialties.filter((s) => s.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : specialties;

  const handleDelete = async (ids: string[]) => {
    try {
      const res = await apiFetch("/api/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "specialties", ids }),
      });
      if (res.ok) { setSelected([]); onRefresh(); }
    } catch {}
    setDeleteId(null);
  };

  const handleAdd = async () => {
    if (!newSpecialty.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "specialties", item: newSpecialty }),
      });
      if (res.ok) {
        setNewSpecialty({ name: "", name_bn: "", slug: "", description: "", description_bn: "", icon: "stethoscope" });
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
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search specialties..." className="pl-9" />
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
                    <th className="px-4 py-3 text-left font-medium">Slug</th>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((spec) => (
                    <tr key={spec.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{spec.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{spec.slug}</td>
                      <td className="px-4 py-3 max-w-xs truncate">{spec.description}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">No specialties found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : action === "add-single" ? (
        <Card>
          <CardHeader><CardTitle>Add New Specialty</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name (EN) *</label>
                <Input value={newSpecialty.name} onChange={(e) => setNewSpecialty({ ...newSpecialty, name: e.target.value })} placeholder="Specialty Name" />
              </div>
              <div>
                <label className="text-sm font-medium">Name (BN)</label>
                <Input value={newSpecialty.name_bn} onChange={(e) => setNewSpecialty({ ...newSpecialty, name_bn: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input value={newSpecialty.slug} onChange={(e) => setNewSpecialty({ ...newSpecialty, slug: e.target.value })} placeholder="auto-generated if empty" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input value={newSpecialty.description} onChange={(e) => setNewSpecialty({ ...newSpecialty, description: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={submitting}>{submitting ? "Adding..." : "Add Specialty"}</Button>
          </CardContent>
        </Card>
      ) : action === "add-multi" ? (
        <Card>
          <CardHeader><CardTitle>Add Multiple Specialties</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">One specialty per line. Format: Name, Description, Icon, Name_BN, Description_BN</p>
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
                      <button onClick={() => { const allIds = filtered.map((s) => s.id); setSelected(allIds.length === selected.length ? [] : allIds); }}>
                        {filtered.length > 0 && filtered.length === selected.length ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Slug</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((spec) => (
                    <tr key={spec.id} className={`border-b last:border-0 cursor-pointer ${selected.includes(spec.id) ? "bg-muted/50" : ""}`} onClick={() => setSelected((prev) => prev.includes(spec.id) ? prev.filter((i) => i !== spec.id) : [...prev, spec.id])}>
                      <td className="px-4 py-3">{selected.includes(spec.id) ? <CheckSquare className="h-5 w-5 text-destructive" /> : <Square className="h-5 w-5 text-muted-foreground" />}</td>
                      <td className="px-4 py-3 font-medium">{spec.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{spec.slug}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} title="Delete Specialty" description="Are you sure you want to delete this specialty?" onConfirm={() => deleteId && handleDelete([deleteId])} />
    </div>
  );
}

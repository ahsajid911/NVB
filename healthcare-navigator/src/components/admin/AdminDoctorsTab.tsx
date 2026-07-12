"use client";

import { useState } from "react";
import { Plus, Trash2, Search, X, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiFetch } from "@/lib/api";

interface AdminDoctorsTabProps {
  doctors: any[];
  loading: boolean;
  onRefresh: () => void;
}

type Action = "view" | "add-single" | "add-multi" | "delete-single" | "delete-multi";

export function AdminDoctorsTab({ doctors, loading, onRefresh }: AdminDoctorsTabProps) {
  const [action, setAction] = useState<Action>("view");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newDoctor, setNewDoctor] = useState({
    name: "", name_bn: "", qualifications: "", qualifications_bn: "",
    experience_years: 5, consultation_fee: 1000, gender: "male" as const,
    contact_phone: "", chamber_address: "", chamber_address_bn: "",
    available_days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
    bio: "", bio_bn: ""
  });
  const [multiText, setMultiText] = useState("");

  const filtered = searchQuery
    ? doctors.filter((d) => d.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : doctors;

  const handleDelete = async (ids: string[]) => {
    try {
      const res = await apiFetch("/api/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "doctors", ids }),
      });
      if (res.ok) {
        setSelected([]);
        onRefresh();
      }
    } catch {}
    setDeleteId(null);
  };

  const handleAdd = async () => {
    if (!newDoctor.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "doctors", item: { ...newDoctor, photo_url: null, contact_email: null } }),
      });
      if (res.ok) {
        setNewDoctor({
          name: "", name_bn: "", qualifications: "", qualifications_bn: "",
          experience_years: 5, consultation_fee: 1000, gender: "male",
          contact_phone: "", chamber_address: "", chamber_address_bn: "",
          available_days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
          bio: "", bio_bn: ""
        });
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
      const [name, qualifications, experience_years, consultation_fee, gender, contact_phone, chamber_address, name_bn, qualifications_bn, chamber_address_bn, bio, bio_bn] = line.split(",").map((s) => s.trim());
      return {
        name: name || "", name_bn: name_bn || "", qualifications: qualifications || "", qualifications_bn: qualifications_bn || "",
        experience_years: parseInt(experience_years) || 5, consultation_fee: parseInt(consultation_fee) || 1000,
        gender: gender === "female" ? "female" : "male", contact_phone: contact_phone || "",
        contact_email: null, chamber_address: chamber_address || "", chamber_address_bn: chamber_address_bn || "",
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
      if (res.ok) { setMultiText(""); setAction("view"); onRefresh(); }
    } catch {}
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["view", "add-single", "add-multi", "delete-single", "delete-multi"] as Action[]).map((a) => (
          <Button
            key={a}
            variant={action === a ? "default" : "outline"}
            size="sm"
            onClick={() => { setAction(a); setSearchQuery(""); }}
          >
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
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doctors..."
            className="pl-9"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : action === "view" ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Qualifications</th>
                    <th className="px-4 py-3 text-left font-medium">Experience</th>
                    <th className="px-4 py-3 text-left font-medium">Fee</th>
                    <th className="px-4 py-3 text-left font-medium">Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{doc.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{doc.qualifications}</td>
                      <td className="px-4 py-3">{doc.experience_years}y</td>
                      <td className="px-4 py-3 text-primary font-medium">৳{doc.consultation_fee}</td>
                      <td className="px-4 py-3 capitalize">{doc.gender}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                        No doctors found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : action === "add-single" ? (
        <Card>
          <CardHeader>
            <CardTitle>Add New Doctor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name (EN) *</label>
                <Input value={newDoctor.name} onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })} placeholder="Dr. John Doe" />
              </div>
              <div>
                <label className="text-sm font-medium">Name (BN)</label>
                <Input value={newDoctor.name_bn} onChange={(e) => setNewDoctor({ ...newDoctor, name_bn: e.target.value })} placeholder="ডঃ জন" />
              </div>
              <div>
                <label className="text-sm font-medium">Qualifications</label>
                <Input value={newDoctor.qualifications} onChange={(e) => setNewDoctor({ ...newDoctor, qualifications: e.target.value })} placeholder="MBBS, MD" />
              </div>
              <div>
                <label className="text-sm font-medium">Experience (years)</label>
                <Input type="number" value={newDoctor.experience_years} onChange={(e) => setNewDoctor({ ...newDoctor, experience_years: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="text-sm font-medium">Fee (৳)</label>
                <Input type="number" value={newDoctor.consultation_fee} onChange={(e) => setNewDoctor({ ...newDoctor, consultation_fee: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input value={newDoctor.contact_phone} onChange={(e) => setNewDoctor({ ...newDoctor, contact_phone: e.target.value })} placeholder="+880-..." />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={submitting}>
              {submitting ? "Adding..." : "Add Doctor"}
            </Button>
          </CardContent>
        </Card>
      ) : action === "add-multi" ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Multiple Doctors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              One doctor per line. Format: Name, Qualifications, Experience, Fee, Gender, Phone, Address, Name_BN, Qualifications_BN, Address_BN, Bio, Bio_BN
            </p>
            <textarea
              value={multiText}
              onChange={(e) => setMultiText(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
              placeholder="Dr. Smith, MBBS MD, 10, 1500, male, +880-1711-001, Square Hospital, ..."
            />
            <Button onClick={handleAddMulti} disabled={submitting}>
              {submitting ? "Adding..." : "Add All"}
            </Button>
          </CardContent>
        </Card>
      ) : action === "delete-multi" ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-destructive">
                Select items and click delete. This cannot be undone.
              </p>
              <Button
                variant="destructive"
                size="sm"
                disabled={selected.length === 0}
                onClick={() => handleDelete(selected)}
              >
                Delete Selected ({selected.length})
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <button
                        onClick={() => {
                          const allIds = filtered.map((d) => d.id);
                          setSelected(allIds.length === selected.length ? [] : allIds);
                        }}
                      >
                        {filtered.length > 0 && filtered.length === selected.length ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Qualifications</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => (
                    <tr
                      key={doc.id}
                      className={`border-b last:border-0 cursor-pointer ${selected.includes(doc.id) ? "bg-muted/50" : ""}`}
                      onClick={() => setSelected((prev) => prev.includes(doc.id) ? prev.filter((i) => i !== doc.id) : [...prev, doc.id])}
                    >
                      <td className="px-4 py-3">
                        {selected.includes(doc.id) ? (
                          <CheckSquare className="h-5 w-5 text-destructive" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{doc.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{doc.qualifications}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Doctor"
        description="Are you sure you want to delete this doctor? This cannot be undone."
        onConfirm={() => deleteId && handleDelete([deleteId])}
      />
    </div>
  );
}

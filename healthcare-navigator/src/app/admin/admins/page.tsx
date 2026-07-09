"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Plus, Pencil, Trash2, KeyRound, ToggleLeft, ToggleRight,
  X, AlertTriangle, CheckCircle, Users, User, ChevronDown,
} from "lucide-react";

interface AdminProfile {
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  last_login: string | null;
  login_count: number | null;
}

interface Admin {
  id: string;
  username: string;
  email: string;
  role: "super_admin" | "admin" | "data_manager";
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile: AdminProfile | null;
}

interface CurrentUser {
  id: string;
  username: string;
  email: string;
  role: string;
  profile?: { full_name: string | null };
}

interface AddAdminForm {
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "data_manager";
  password: string;
  confirmPassword: string;
}

interface EditAdminForm {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "super_admin" | "admin" | "data_manager";
}

interface ResetPasswordForm {
  id: string;
  newPassword: string;
  confirmPassword: string;
}

type ModalType = "add" | "edit" | "resetPassword" | "delete" | null;

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [submitting, setSubmitting] = useState(false);

  const [addForm, setAddForm] = useState<AddAdminForm>({
    username: "", email: "", full_name: "", role: "admin", password: "", confirmPassword: "",
  });
  const [editForm, setEditForm] = useState<EditAdminForm>({
    id: "", username: "", email: "", full_name: "", role: "admin",
  });
  const [resetForm, setResetForm] = useState<ResetPasswordForm>({
    id: "", newPassword: "", confirmPassword: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);

  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [resetErrors, setResetErrors] = useState<Record<string, string>>({});

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/admin/auth/me");
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        if (data.user.role !== "super_admin") {
          showToast("error", "Access denied. Only super admins can manage admin users.");
        }
      }
    } catch {
      showToast("error", "Failed to load session.");
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/admins");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch admins");
      setAdmins(data.admins || []);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load admins.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchAdmins();
  }, []);

  const closeAllModals = () => {
    setActiveModal(null);
    setAddForm({ username: "", email: "", full_name: "", role: "admin", password: "", confirmPassword: "" });
    setEditForm({ id: "", username: "", email: "", full_name: "", role: "admin" });
    setResetForm({ id: "", newPassword: "", confirmPassword: "" });
    setDeleteTarget(null);
    setAddErrors({});
    setEditErrors({});
    setResetErrors({});
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateAddForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!addForm.username.trim()) errors.username = "Username is required";
    if (!addForm.email.trim()) errors.email = "Email is required";
    else if (!validateEmail(addForm.email)) errors.email = "Invalid email format";
    if (!addForm.full_name.trim()) errors.full_name = "Full name is required";
    if (!addForm.password) errors.password = "Password is required";
    else if (addForm.password.length < 8) errors.password = "Minimum 8 characters";
    if (!addForm.confirmPassword) errors.confirmPassword = "Please confirm password";
    else if (addForm.password !== addForm.confirmPassword) errors.confirmPassword = "Passwords do not match";
    setAddErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!editForm.email.trim()) errors.email = "Email is required";
    else if (!validateEmail(editForm.email)) errors.email = "Invalid email format";
    if (!editForm.full_name.trim()) errors.full_name = "Full name is required";
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateResetForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!resetForm.newPassword) errors.newPassword = "Password is required";
    else if (resetForm.newPassword.length < 8) errors.newPassword = "Minimum 8 characters";
    if (!resetForm.confirmPassword) errors.confirmPassword = "Please confirm password";
    else if (resetForm.newPassword !== resetForm.confirmPassword) errors.confirmPassword = "Passwords do not match";
    setResetErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAdmin = async () => {
    if (!validateAddForm()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: addForm.username.trim(),
          email: addForm.email.trim(),
          full_name: addForm.full_name.trim(),
          role: addForm.role,
          password: addForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create admin");
      showToast("success", "Admin created successfully.");
      closeAllModals();
      fetchAdmins();
    } catch (err: any) {
      showToast("error", err.message || "Failed to create admin.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAdmin = async () => {
    if (!validateEditForm()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editForm.id,
          email: editForm.email.trim(),
          full_name: editForm.full_name.trim(),
          role: editForm.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update admin");
      showToast("success", "Admin updated successfully.");
      closeAllModals();
      fetchAdmins();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update admin.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateResetForm()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/admins/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resetForm.id, newPassword: resetForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      showToast("success", "Password reset successfully.");
      closeAllModals();
    } catch (err: any) {
      showToast("error", err.message || "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (admin: Admin) => {
    try {
      const res = await fetch("/api/admin/admins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: admin.id, is_active: !admin.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      showToast("success", `${admin.username} has been ${admin.is_active ? "disabled" : "enabled"}.`);
      fetchAdmins();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update status.");
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete admin");
      showToast("success", `${deleteTarget.username} has been deleted.`);
      closeAllModals();
      fetchAdmins();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete admin.");
    } finally {
      setSubmitting(false);
    }
  };

  const openAddModal = () => {
    setAddForm({ username: "", email: "", full_name: "", role: "admin", password: "", confirmPassword: "" });
    setAddErrors({});
    setActiveModal("add");
  };

  const openEditModal = (admin: Admin) => {
    setEditForm({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      full_name: admin.profile?.full_name || "",
      role: admin.role,
    });
    setEditErrors({});
    setActiveModal("edit");
  };

  const openResetPasswordModal = (admin: Admin) => {
    setResetForm({ id: admin.id, newPassword: "", confirmPassword: "" });
    setResetErrors({});
    setActiveModal("resetPassword");
  };

  const openDeleteModal = (admin: Admin) => {
    setDeleteTarget(admin);
    setActiveModal("delete");
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-[#dbeafe] text-[#1d4ed8] border border-[#bfdbfe]";
      case "admin":
        return "bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]";
      case "data_manager":
        return "bg-[#f3e8ff] text-[#7c3aed] border border-[#e9d5ff]";
      default:
        return "bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]";
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? "bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]"
      : "bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]";
  };

  const formatRole = (role: string) =>
    role.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  if (currentUser && currentUser.role !== "super_admin") {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-12 lg:px-10">
        <div className="rounded-2xl bg-white border border-[#e5e7eb] p-12 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fef2f2] mb-5">
            <AlertTriangle className="h-7 w-7 text-[#dc2626]" />
          </div>
          <h2 className="text-[22px] font-semibold text-[#0f172a]">Access Denied</h2>
          <p className="mt-2 text-[15px] text-[#64748b]">
            Only super administrators can manage admin users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 lg:px-10">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 text-[14px] font-medium shadow-lg border transition-all ${
          toast.type === "success"
            ? "bg-[#f0fdf4] text-[#166534] border-[#86efac]"
            : "bg-[#fef2f2] text-[#991b1b] border-[#fca5a5]"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle className="h-4.5 w-4.5 shrink-0 text-[#16a34a]" />
          ) : (
            <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-[#dc2626]" />
          )}
          {toast.text}
          <button onClick={() => setToast(null)} className="ml-2 text-[#94a3b8] hover:text-[#475569]">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[36px] font-semibold text-[#0f172a] sm:text-[44px] tracking-[-0.374px]" style={{ fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif' }}>
            Manage Admins
          </h1>
          <p className="mt-3 text-[18px] text-[#64748b]">Create, edit, and manage administrator accounts</p>
        </div>
        {currentUser?.role === "super_admin" && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-3 text-[14px] font-medium text-white hover:bg-[#1d4ed8] transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Admin
          </button>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="rounded-2xl bg-white border border-[#e5e7eb] overflow-hidden">
          <div className="bg-[#f8fafc] border-b border-[#e5e7eb] px-5 py-4">
            <div className="h-4 w-40 rounded bg-[#e2e8f0] animate-pulse" />
          </div>
          <div className="divide-y divide-[#f1f5f9]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-[#e2e8f0] animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-[#e2e8f0] animate-pulse" />
                  <div className="h-3 w-32 rounded bg-[#f1f5f9] animate-pulse" />
                </div>
                <div className="h-6 w-20 rounded-full bg-[#e2e8f0] animate-pulse" />
                <div className="h-6 w-16 rounded-full bg-[#e2e8f0] animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#e2e8f0] animate-pulse" />
                  <div className="h-8 w-8 rounded-lg bg-[#e2e8f0] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && admins.length === 0 && (
        <div className="rounded-2xl bg-white border border-[#e5e7eb] p-12 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f5f9] mb-5">
            <Users className="h-7 w-7 text-[#94a3b8]" />
          </div>
          <h3 className="text-[18px] font-semibold text-[#0f172a]">No Admin Users</h3>
          <p className="mt-2 text-[14px] text-[#64748b] max-w-sm mx-auto">
            Get started by creating your first administrator account.
          </p>
          {currentUser?.role === "super_admin" && (
            <button
              onClick={openAddModal}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-3 text-[14px] font-medium text-white hover:bg-[#1d4ed8] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Admin
            </button>
          )}
        </div>
      )}

      {/* Admins Table */}
      {!loading && admins.length > 0 && (
        <div className="rounded-2xl bg-white border border-[#e5e7eb] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#f8fafc] border-b border-[#e5e7eb]">
                <tr>
                  <th className="px-6 py-3.5 text-[13px] font-semibold text-[#475569]">Name</th>
                  <th className="px-6 py-3.5 text-[13px] font-semibold text-[#475569]">Username</th>
                  <th className="px-6 py-3.5 text-[13px] font-semibold text-[#475569]">Email</th>
                  <th className="px-6 py-3.5 text-[13px] font-semibold text-[#475569]">Role</th>
                  <th className="px-6 py-3.5 text-[13px] font-semibold text-[#475569]">Status</th>
                  <th className="px-6 py-3.5 text-[13px] font-semibold text-[#475569] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {admins.map((admin) => {
                  const isCurrentUser = currentUser?.id === admin.id;
                  return (
                    <tr key={admin.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f5f9] text-[13px] font-semibold text-[#475569] shrink-0">
                            {admin.profile?.full_name?.[0] || admin.username[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-medium text-[#0f172a] truncate">
                              {admin.profile?.full_name || admin.username}
                              {isCurrentUser && (
                                <span className="ml-1.5 text-[12px] font-normal text-[#94a3b8]">(You)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-[#475569] font-medium">{admin.username}</td>
                      <td className="px-6 py-4 text-[13px] text-[#64748b]">{admin.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium ${getRoleBadge(admin.role)}`}>
                          {formatRole(admin.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium ${getStatusBadge(admin.is_active)}`}>
                          {admin.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(admin)}
                            title="Edit"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#2563eb] transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openResetPasswordModal(admin)}
                            title="Reset Password"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#d97706] transition-colors"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(admin)}
                            title={admin.is_active ? "Disable" : "Enable"}
                            disabled={isCurrentUser}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#2563eb] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {admin.is_active ? (
                              <ToggleRight className="h-4 w-4 text-[#16a34a]" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-[#dc2626]" />
                            )}
                          </button>
                          <button
                            onClick={() => openDeleteModal(admin)}
                            title="Delete"
                            disabled={isCurrentUser}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-[#64748b] hover:bg-[#fef2f2] hover:text-[#dc2626] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- ADD ADMIN MODAL ---- */}
      {activeModal === "add" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAllModals} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e7eb]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dbeafe]">
                  <Plus className="h-4.5 w-4.5 text-[#2563eb]" />
                </div>
                <h3 className="text-[18px] font-semibold text-[#0f172a]">Add New Admin</h3>
              </div>
              <button onClick={closeAllModals} className="text-[#94a3b8] hover:text-[#475569] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Username */}
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">Username *</label>
                <input
                  type="text"
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                  className={`mt-1.5 w-full rounded-xl border ${addErrors.username ? "border-[#fca5a5] ring-2 ring-[#fca5a5]/30" : "border-[#e5e7eb]"} bg-[#f8fafc] px-4 py-2.5 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 focus:outline-none transition-all`}
                  placeholder="e.g. john_admin"
                />
                {addErrors.username && <p className="mt-1 text-[12px] text-[#dc2626]">{addErrors.username}</p>}
              </div>
              {/* Email */}
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">Email *</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className={`mt-1.5 w-full rounded-xl border ${addErrors.email ? "border-[#fca5a5] ring-2 ring-[#fca5a5]/30" : "border-[#e5e7eb]"} bg-[#f8fafc] px-4 py-2.5 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 focus:outline-none transition-all`}
                  placeholder="admin@example.com"
                />
                {addErrors.email && <p className="mt-1 text-[12px] text-[#dc2626]">{addErrors.email}</p>}
              </div>
              {/* Full Name */}
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">Full Name *</label>
                <input
                  type="text"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  className={`mt-1.5 w-full rounded-xl border ${addErrors.full_name ? "border-[#fca5a5] ring-2 ring-[#fca5a5]/30" : "border-[#e5e7eb]"} bg-[#f8fafc] px-4 py-2.5 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 focus:outline-none transition-all`}
                  placeholder="John Doe"
                />
                {addErrors.full_name && <p className="mt-1 text-[12px] text-[#dc2626]">{addErrors.full_name}</p>}
              </div>
              {/* Role */}
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">Role *</label>
                <div className="relative mt-1.5">
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value as any })}
                    className="w-full appearance-none rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-2.5 pr-10 text-[14px] text-[#0f172a] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 focus:outline-none transition-all"
                  >
                    <option value="admin">Admin</option>
                    <option value="data_manager">Data Manager</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8] pointer-events-none" />
                </div>
                <p className="mt-1 text-[12px] text-[#94a3b8]">Super Admin role cannot be assigned.</p>
              </div>
              {/* Password */}
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">Password *</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className={`mt-1.5 w-full rounded-xl border ${addErrors.password ? "border-[#fca5a5] ring-2 ring-[#fca5a5]/30" : "border-[#e5e7eb]"} bg-[#f8fafc] px-4 py-2.5 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 focus:outline-none transition-all`}
                  placeholder="Minimum 8 characters"
                />
                {addErrors.password && <p className="mt-1 text-[12px] text-[#dc2626]">{addErrors.password}</p>}
              </div>
              {/* Confirm Password */}
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">Confirm Password *</label>
                <input
                  type="password"
                  value={addForm.confirmPassword}
                  onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })}
                  className={`mt-1.5 w-full rounded-xl border ${addErrors.confirmPassword ? "border-[#fca5a5] ring-2 ring-[#fca5a5]/30" : "border-[#e5e7eb]"} bg-[#f8fafc] px-4 py-2.5 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 focus:outline-none transition-all`}
                  placeholder="Re-enter password"
                />
                {addErrors.confirmPassword && <p className="mt-1 text-[12px] text-[#dc2626]">{addErrors.confirmPassword}</p>}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e5e7eb] bg-[#f8fafc]">
              <button onClick={closeAllModals} className="rounded-xl border border-[#e5e7eb] bg-white px-5 py-2.5 text-[14px] font-medium text-[#475569] hover:bg-[#f1f5f9] transition-colors">
                Cancel
              </button>
              <button onClick={handleAddAdmin} disabled={submitting} className="rounded-xl bg-[#2563eb] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50">
                {submitting ? "Creating..." : "Create Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- EDIT ADMIN MODAL ---- */}
      {activeModal === "edit" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAllModals} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e7eb]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1f5f9]">
                  <Pencil className="h-4.5 w-4.5 text-[#475569]" />
                </div>
                <h3 className="text-[18px] font-semibold text-[#0f172a]">Edit Admin</h3>
              </div>
              <button onClick={closeAllModals} className="text-[#94a3b8] hover:text-[#475569] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Username (read-only) */}
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  disabled
                  className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] bg-[#f1f5f9] px-4 py-2.5 text-[14px] text-[#94a3b8] cursor-not-allowed"
                />
                <p className="mt-1 text-[12px] text-[#94a3b8]">Username cannot be changed.</p>
              </div>
              {/* Email */}
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">Email *</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className={`mt-1.5 w-full rounded-xl border ${editErrors.email ? "border-[#fca5a5] ring-2 ring-[#fca5a5]/30" : "border-[#e5e7eb]"} bg-[#f8fafc] px-4 py-2.5 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 focus:outline-none transition-all`}
                  placeholder="admin@example.com"
                />
                {editErrors.email && <p className="mt-1 text-[12px] text-[#dc2626]">{editErrors.email}</p>}
              </div>
              {/* Full Name */}
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">Full Name *</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className={`mt-1.5 w-full rounded-xl border ${editErrors.full_name ? "border-[#fca5a5] ring-2 ring-[#fca5a5]/30" : "border-[#e5e7eb]"} bg-[#f8fafc] px-4 py-2.5 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 focus:outline-none transition-all`}
                  placeholder="John Doe"
                />
                {editErrors.full_name && <p className="mt-1 text-[12px] text-[#dc2626]">{editErrors.full_name}</p>}
              </div>
              {/* Role */}
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">Role *</label>
                <div className="relative mt-1.5">
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                    className="w-full appearance-none rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-2.5 pr-10 text-[14px] text-[#0f172a] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 focus:outline-none transition-all"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="data_manager">Data Manager</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8] pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e5e7eb] bg-[#f8fafc]">
              <button onClick={closeAllModals} className="rounded-xl border border-[#e5e7eb] bg-white px-5 py-2.5 text-[14px] font-medium text-[#475569] hover:bg-[#f1f5f9] transition-colors">
                Cancel
              </button>
              <button onClick={handleEditAdmin} disabled={submitting} className="rounded-xl bg-[#2563eb] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50">
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- RESET PASSWORD MODAL ---- */}
      {activeModal === "resetPassword" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAllModals} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e7eb]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fef3c7]">
                  <KeyRound className="h-4.5 w-4.5 text-[#d97706]" />
                </div>
                <h3 className="text-[18px] font-semibold text-[#0f172a]">Reset Password</h3>
              </div>
              <button onClick={closeAllModals} className="text-[#94a3b8] hover:text-[#475569] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-[13px] text-[#64748b]">
                Set a new password for <span className="font-medium text-[#0f172a]">
                  {admins.find((a) => a.id === resetForm.id)?.username}
                </span>.
              </p>
              {/* New Password */}
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">New Password *</label>
                <input
                  type="password"
                  value={resetForm.newPassword}
                  onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                  className={`mt-1.5 w-full rounded-xl border ${resetErrors.newPassword ? "border-[#fca5a5] ring-2 ring-[#fca5a5]/30" : "border-[#e5e7eb]"} bg-[#f8fafc] px-4 py-2.5 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 focus:outline-none transition-all`}
                  placeholder="Minimum 8 characters"
                />
                {resetErrors.newPassword && <p className="mt-1 text-[12px] text-[#dc2626]">{resetErrors.newPassword}</p>}
              </div>
              {/* Confirm Password */}
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">Confirm Password *</label>
                <input
                  type="password"
                  value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                  className={`mt-1.5 w-full rounded-xl border ${resetErrors.confirmPassword ? "border-[#fca5a5] ring-2 ring-[#fca5a5]/30" : "border-[#e5e7eb]"} bg-[#f8fafc] px-4 py-2.5 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 focus:outline-none transition-all`}
                  placeholder="Re-enter password"
                />
                {resetErrors.confirmPassword && <p className="mt-1 text-[12px] text-[#dc2626]">{resetErrors.confirmPassword}</p>}
              </div>
              <div className="rounded-xl bg-[#fffbeb] border border-[#fde68a] px-4 py-3 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-[#d97706] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#92400e]">
                  This will invalidate all existing sessions for this user. They will need to sign in again.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e5e7eb] bg-[#f8fafc]">
              <button onClick={closeAllModals} className="rounded-xl border border-[#e5e7eb] bg-white px-5 py-2.5 text-[14px] font-medium text-[#475569] hover:bg-[#f1f5f9] transition-colors">
                Cancel
              </button>
              <button onClick={handleResetPassword} disabled={submitting} className="rounded-xl bg-[#d97706] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#b45309] transition-colors disabled:opacity-50">
                {submitting ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- DELETE CONFIRMATION MODAL ---- */}
      {activeModal === "delete" && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAllModals} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e7eb]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fef2f2]">
                  <Trash2 className="h-4.5 w-4.5 text-[#dc2626]" />
                </div>
                <h3 className="text-[18px] font-semibold text-[#0f172a]">Delete Admin</h3>
              </div>
              <button onClick={closeAllModals} className="text-[#94a3b8] hover:text-[#475569] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="rounded-xl bg-[#fef2f2] border border-[#fecaca] px-4 py-3 mb-4 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-[#dc2626] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#991b1b]">
                  This action is permanent and cannot be undone. All data associated with this admin account will be removed.
                </p>
              </div>
              <p className="text-[14px] text-[#475569]">
                Are you sure you want to delete <span className="font-semibold text-[#0f172a]">{deleteTarget.username}</span>?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e5e7eb] bg-[#f8fafc]">
              <button onClick={closeAllModals} className="rounded-xl border border-[#e5e7eb] bg-white px-5 py-2.5 text-[14px] font-medium text-[#475569] hover:bg-[#f1f5f9] transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteAdmin} disabled={submitting} className="rounded-xl bg-[#dc2626] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#b91c1c] transition-colors disabled:opacity-50">
                {submitting ? "Deleting..." : "Delete Admin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

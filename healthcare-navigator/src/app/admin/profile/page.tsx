"use client";

import { useState, useEffect } from "react";
import {
  User, Mail, Phone, Shield, Calendar, Clock, Save,
  Eye, EyeOff, CheckCircle, AlertCircle, Loader2,
} from "lucide-react";

interface ProfileData {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  last_login: string;
  profile: {
    full_name: string;
    bio: string;
    phone: string;
    avatar_url: string;
  };
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-[960px] px-6 py-12 lg:px-10 space-y-8 animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-[#e5e7eb]" />
      <div className="h-5 w-80 rounded-lg bg-[#e5e7eb]" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-[#e5e7eb] p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="h-24 w-24 rounded-full bg-[#e5e7eb]" />
            <div className="space-y-3 flex-1">
              <div className="h-5 w-48 rounded-lg bg-[#e5e7eb]" />
              <div className="h-4 w-32 rounded-lg bg-[#e5e7eb]" />
            </div>
          </div>
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded bg-[#e5e7eb]" />
                <div className="h-11 w-full rounded-xl bg-[#e5e7eb]" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#e5e7eb] p-8 space-y-5">
          <div className="h-5 w-40 rounded-lg bg-[#e5e7eb]" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded bg-[#e5e7eb]" />
              <div className="h-4 w-36 rounded bg-[#e5e7eb]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editing, setEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/admin/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile || data.id) {
          setProfile(data);
          setFullName(data.profile?.full_name || "");
          setBio(data.profile?.bio || "");
          setPhone(data.profile?.phone || "");
          setAvatarUrl(data.profile?.avatar_url || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showFeedback = (
    setter: React.Dispatch<React.SetStateAction<{ type: "success" | "error"; text: string } | null>>,
    type: "success" | "error",
    text: string
  ) => {
    setter({ type, text });
    setTimeout(() => setter(null), 4000);
  };

  const getInitials = () => {
    if (fullName) {
      return fullName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    }
    if (profile?.username) return profile.username[0].toUpperCase();
    return "A";
  };

  const handleProfileSave = async () => {
    if (!fullName.trim()) {
      showFeedback(setProfileMessage, "error", "Full name is required");
      return;
    }
    setProfileSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, bio, phone, avatar_url: avatarUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(setProfileMessage, "success", "Profile updated successfully");
        setEditing(false);
        if (data.profile) {
          setProfile((prev) => (prev ? { ...prev, profile: data.profile } : prev));
        }
      } else {
        showFeedback(setProfileMessage, "error", data.error || "Failed to update profile");
      }
    } catch {
      showFeedback(setProfileMessage, "error", "Network error. Please try again.");
    }
    setProfileSaving(false);
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showFeedback(setPasswordMessage, "error", "All password fields are required");
      return;
    }
    if (newPassword.length < 8) {
      showFeedback(setPasswordMessage, "error", "New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      showFeedback(setPasswordMessage, "error", "New passwords do not match");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(setPasswordMessage, "success", "Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showFeedback(setPasswordMessage, "error", data.error || "Failed to change password");
      }
    } catch {
      showFeedback(setPasswordMessage, "error", "Network error. Please try again.");
    }
    setPasswordSaving(false);
  };

  if (loading) return <Skeleton />;

  return (
    <div className="mx-auto max-w-[960px] px-6 py-12 lg:px-10">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-[36px] font-semibold text-[#0f172a] sm:text-[44px] tracking-[-0.374px]"
          style={{ fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif' }}
        >
          My Profile
        </h1>
        <p className="mt-3 text-[18px] text-[#64748b]">
          Manage your personal information and security settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile & Password */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Information Card */}
          <div className="rounded-2xl bg-white border border-[#e5e7eb] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-7">
              <h2 className="text-[20px] font-semibold text-[#0f172a] flex items-center gap-2">
                <User className="h-5 w-5 text-[#2563eb]" />
                Profile Information
              </h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-full bg-[#f1f5f9] px-5 py-2 text-[14px] font-medium text-[#475569] hover:bg-[#e2e8f0] transition-colors"
                >
                  Edit
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditing(false);
                    setFullName(profile?.profile?.full_name || "");
                    setBio(profile?.profile?.bio || "");
                    setPhone(profile?.profile?.phone || "");
                    setAvatarUrl(profile?.profile?.avatar_url || "");
                  }}
                  className="rounded-full bg-[#f1f5f9] px-5 py-2 text-[14px] font-medium text-[#475569] hover:bg-[#e2e8f0] transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Profile Feedback */}
            {profileMessage && (
              <div
                className={`mb-6 flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-medium ${
                  profileMessage.type === "success"
                    ? "bg-[#dcfce7] text-[#166534] border border-[#86efac]"
                    : "bg-[#fef2f2] text-[#991b1b] border border-[#fca5a5]"
                }`}
              >
                {profileMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                {profileMessage.text}
              </div>
            )}

            {/* Avatar */}
            <div className="flex items-center gap-5 mb-7">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-24 w-24 rounded-full object-cover border-2 border-[#e5e7eb]"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#2563eb] text-white text-[28px] font-semibold">
                    {getInitials()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[17px] font-semibold text-[#0f172a]">
                  {fullName || profile?.username || "Admin"}
                </p>
                <p className="text-[14px] text-[#64748b] capitalize">
                  {profile?.role?.replace("_", " ")}
                </p>
                {editing && (
                  <div className="mt-2">
                    <input
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="Avatar URL (optional)"
                      className="w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none max-w-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!editing}
                  className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#475569]">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={!editing}
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-colors resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[13px] font-semibold text-[#475569]">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!editing}
                    className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    placeholder="+880-..."
                  />
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-[#475569]">Email</label>
                  <input
                    value={profile?.email || ""}
                    readOnly
                    className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] bg-[#f1f5f9] px-4 py-3 text-[15px] text-[#64748b] cursor-not-allowed"
                  />
                  <p className="mt-1 text-[12px] text-[#94a3b8]">Email cannot be changed here</p>
                </div>
              </div>

              {editing && (
                <button
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                  className="flex items-center gap-2 rounded-full bg-[#2563eb] px-6 py-3 text-[15px] font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
                >
                  {profileSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Change Password Card */}
          <div className="rounded-2xl bg-white border border-[#e5e7eb] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-[20px] font-semibold text-[#0f172a] flex items-center gap-2 mb-7">
              <Shield className="h-5 w-5 text-[#2563eb]" />
              Change Password
            </h2>

            {/* Password Feedback */}
            {passwordMessage && (
              <div
                className={`mb-6 flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-medium ${
                  passwordMessage.type === "success"
                    ? "bg-[#dcfce7] text-[#166534] border border-[#86efac]"
                    : "bg-[#fef2f2] text-[#991b1b] border border-[#fca5a5]"
                }`}
              >
                {passwordMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                {passwordMessage.text}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="text-[13px] font-semibold text-[#475569]">Current Password</label>
                <div className="relative mt-1.5">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 pr-11 text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none transition-colors"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                  >
                    {showCurrent ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#475569]">New Password</label>
                <div className="relative mt-1.5">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 pr-11 text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none transition-colors"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                  >
                    {showNew ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {newPassword && newPassword.length < 8 && (
                  <p className="mt-1.5 text-[12px] text-[#d97706]">Password must be at least 8 characters</p>
                )}
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#475569]">Confirm New Password</label>
                <div className="relative mt-1.5">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 pr-11 text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none transition-colors"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1.5 text-[12px] text-[#d97706]">Passwords do not match</p>
                )}
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={passwordSaving}
                className="flex items-center gap-2 rounded-full bg-[#2563eb] px-6 py-3 text-[15px] font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
              >
                {passwordSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Account Info */}
        <div className="space-y-8">
          <div className="rounded-2xl bg-white border border-[#e5e7eb] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-[20px] font-semibold text-[#0f172a] mb-6">Account Information</h2>
            <div className="space-y-5">
              <div>
                <p className="text-[12px] font-semibold text-[#94a3b8] uppercase tracking-wide">Username</p>
                <p className="mt-1 text-[15px] font-medium text-[#0f172a]">{profile?.username || "—"}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[#94a3b8] uppercase tracking-wide">Email</p>
                <p className="mt-1 text-[15px] font-medium text-[#0f172a] break-all">{profile?.email || "—"}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[#94a3b8] uppercase tracking-wide">Role</p>
                <p className="mt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eff6ff] px-3 py-1 text-[13px] font-medium text-[#2563eb] capitalize">
                    <Shield className="h-3 w-3" />
                    {profile?.role?.replace("_", " ") || "—"}
                  </span>
                </p>
              </div>
              <div className="border-t border-[#f1f5f9] pt-5">
                <p className="text-[12px] font-semibold text-[#94a3b8] uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  Member Since
                </p>
                <p className="mt-1 text-[15px] font-medium text-[#0f172a]">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[#94a3b8] uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Last Login
                </p>
                <p className="mt-1 text-[15px] font-medium text-[#0f172a]">
                  {profile?.last_login
                    ? new Date(profile.last_login).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

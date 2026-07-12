"use client";

import { useState, useEffect } from "react";
import {
  User, Mail, Phone, Shield, Calendar, Clock, Save,
  Eye, EyeOff, CheckCircle, AlertCircle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-[960px] px-6 py-12 lg:px-10 space-y-8">
      <div>
        <Skeleton className="h-10 w-64 mb-3" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-6 mb-8">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="space-y-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-8 space-y-5">
              <Skeleton className="h-5 w-40" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ))}
            </CardContent>
          </Card>
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
        const userData = data.user || data;
        const profileData = data.profile || {};
        if (userData.id || userData.username) {
          setProfile({
            ...userData,
            profile: profileData,
          });
          setFullName(profileData.full_name || "");
          setBio(profileData.bio || "");
          setPhone(profileData.phone || "");
          setAvatarUrl(profileData.avatar_url || "");
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
          setProfile((prev) => prev ? { ...prev, profile: data.profile } : prev);
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

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="mx-auto max-w-[960px] px-6 py-12 lg:px-10">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">My Profile</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Manage your personal information and security settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => {
                  setEditing(false);
                  setFullName(profile?.profile?.full_name || "");
                  setBio(profile?.profile?.bio || "");
                  setPhone(profile?.profile?.phone || "");
                  setAvatarUrl(profile?.profile?.avatar_url || "");
                }}>
                  Cancel
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {profileMessage && (
                <div
                  className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
                    profileMessage.type === "success"
                      ? "bg-success/10 text-success border border-success/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}
                  role="alert"
                >
                  {profileMessage.type === "success" ? (
                    <CheckCircle className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  {profileMessage.text}
                </div>
              )}

              <div className="flex items-center gap-5">
                <div className="relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-24 w-24 rounded-full object-cover border-2 border-border" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold">
                      {getInitials()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {fullName || profile?.username || "Admin"}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {profile?.role?.replace("_", " ")}
                  </p>
                  {editing && (
                    <div className="mt-2">
                      <Input
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="Avatar URL (optional)"
                        className="max-w-xs text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!editing}
                    placeholder="Enter your full name"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="text-sm font-medium text-muted-foreground">Bio</label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={!editing}
                    rows={3}
                    className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="text-sm font-medium text-muted-foreground">Phone</label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={!editing}
                      placeholder="+880-..."
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email</label>
                    <Input
                      id="email"
                      value={profile?.email || ""}
                      readOnly
                      className="mt-1.5 bg-muted cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed here</p>
                  </div>
                </div>

                {editing && (
                  <Button onClick={handleProfileSave} disabled={profileSaving}>
                    {profileSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordMessage && (
                <div
                  className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
                    passwordMessage.type === "success"
                      ? "bg-success/10 text-success border border-success/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}
                  role="alert"
                >
                  {passwordMessage.type === "success" ? (
                    <CheckCircle className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  {passwordMessage.text}
                </div>
              )}

              <div>
                <label htmlFor="currentPassword" className="text-sm font-medium text-muted-foreground">Current Password</label>
                <div className="relative mt-1.5">
                  <Input
                    id="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showCurrent ? "Hide password" : "Show password"}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="text-sm font-medium text-muted-foreground">New Password</label>
                <div className="relative mt-1.5">
                  <Input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPassword && newPassword.length < 8 && (
                  <p className="mt-1.5 text-xs text-warning">Password must be at least 8 characters</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">Confirm New Password</label>
                <div className="relative mt-1.5">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1.5 text-xs text-warning">Passwords do not match</p>
                )}
              </div>

              <Button onClick={handlePasswordChange} disabled={passwordSaving}>
                {passwordSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Username</p>
                <p className="mt-1 text-sm font-medium text-foreground">{profile?.username || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
                <p className="mt-1 text-sm font-medium text-foreground break-all">{profile?.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</p>
                <p className="mt-1">
                  <Badge variant="secondary" className="capitalize">
                    <Shield className="h-3 w-3 mr-1" />
                    {profile?.role?.replace("_", " ") || "—"}
                  </Badge>
                </p>
              </div>
              <div className="border-t pt-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  Member Since
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Last Login
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

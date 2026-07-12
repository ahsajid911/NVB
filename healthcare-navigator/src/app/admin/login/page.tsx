"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Stethoscope, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/features/LanguageSwitcher";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "/admin";
  const redirect = redirectParam.startsWith("/") && !redirectParam.startsWith("//") ? redirectParam : "/admin";
  const { t } = useLanguage();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      router.push(redirect);
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl">
      <h2 className="text-lg font-semibold text-foreground mb-6">Sign in to your account</h2>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive" role="alert">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5" aria-label="Admin login form">
        <div>
          <label htmlFor="username" className="text-sm font-semibold text-muted-foreground">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            aria-required="true"
            className="mt-1.5 w-full rounded-xl border border-input bg-muted px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
            placeholder="Enter your username"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-semibold text-muted-foreground">Password</label>
          <div className="relative mt-1.5">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-required="true"
              className="w-full rounded-xl border border-input bg-muted px-4 py-3 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full rounded-xl bg-primary px-4 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" aria-hidden="true" />
              Signing in...
            </span>
          ) : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <div className="text-left">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563eb] mb-4">
              <Stethoscope className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-[24px] font-semibold text-white">Admin Panel</h1>
            <p className="mt-1 text-[14px] text-[#94a3b8]">Healthcare Navigator Bangladesh</p>
          </div>
          <div className="mt-2">
            <LanguageSwitcher variant="admin" />
          </div>
        </div>

        <Suspense fallback={
          <div className="rounded-2xl bg-white p-8 shadow-xl text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent mx-auto" />
          </div>
        }>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-[12px] text-[#64748b]">
          Protected admin area. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Building2, Stethoscope, FileText,
  Upload, Download, Activity, Settings, LogOut, Menu, X,
  ChevronDown, Shield, User, ClipboardList, MapPin,
} from "lucide-react";
import LanguageSwitcher from "@/components/features/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetch("/api/admin/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setAdminUser(data.user);
        } else if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
      })
      .catch(() => {
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
      })
      .finally(() => setLoading(false));
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent mx-auto" />
          <p className="mt-4 text-[14px] text-[#64748b]">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  const sidebarLinks = [
    { href: "/admin", label: t.admin.dashboard, icon: LayoutDashboard, exact: true },
    { section: t.admin.healthcareData },
    { href: "/admin/doctors", label: t.admin.doctors, icon: Users },
    { href: "/admin/hospitals", label: t.admin.hospitals, icon: Building2 },
    { href: "/admin/specialties", label: t.admin.specialties, icon: Stethoscope },
    { href: "/admin/districts", label: t.admin.districts, icon: MapPin },
    { section: t.admin.importExport },
    { href: "/admin/import", label: t.admin.importCenter, icon: Upload },
    { href: "/admin/export", label: t.admin.exportData, icon: Download },
    { section: t.admin.administration },
    { href: "/admin/admins", label: t.admin.manageAdmins, icon: Shield, roles: ["super_admin"] },
    { href: "/admin/logs", label: t.admin.activityLogs, icon: ClipboardList, roles: ["super_admin", "admin"] },
    { href: "/admin/ai", label: "AI Settings", icon: Settings },
    { href: "/admin/profile", label: t.admin.myProfile, icon: User },
  ];

  const filteredLinks = sidebarLinks.filter((link) => {
    if ("section" in link) return true;
    if (link.roles && adminUser) {
      return link.roles.includes(adminUser.role);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-[#0f172a] transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563eb]">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-white">{t.common.appName}</p>
                <p className="text-[11px] text-white/50">{t.admin.adminPanel}</p>
              </div>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-white/50 hover:text-white transition-colors"
              aria-label="View public site (opens in new tab)"
            >
              View Site ↗
            </a>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {filteredLinks.map((link, i) => {
              if ("section" in link) {
                return (
                  <p key={i} className="px-3 pt-5 pb-2 text-[11px] font-semibold text-white/30 uppercase tracking-wider">
                    {link.section}
                  </p>
                );
              }
              const Icon = link.icon;
              const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href!}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors mb-0.5 ${isActive ? "bg-[#2563eb] text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e293b] text-white/60 text-[13px] font-semibold">
                {adminUser?.profile?.full_name?.[0] || adminUser?.username?.[0] || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-white truncate">{adminUser?.profile?.full_name || adminUser?.username}</p>
                <p className="text-[11px] text-white/40 capitalize">{adminUser?.role?.replace("_", " ")}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] text-white/50 hover:text-white hover:bg-white/5 transition-colors">
              <LogOut className="h-4 w-4" />
              {t.admin.signOut}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-[#e5e7eb] h-14 flex items-center px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 -ml-1.5 text-[#64748b] hover:text-[#0f172a]">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-medium text-[#64748b] hover:text-[#0f172a] transition-colors"
              aria-label="View public site (opens in new tab)"
            >
              View Site ↗
            </a>
            <div className="h-5 w-px bg-[#e5e7eb]" />
            <LanguageSwitcher variant="admin" />
            <span className="text-[12px] font-medium text-[#64748b] bg-[#f1f5f9] px-3 py-1 rounded-full capitalize">
              {adminUser?.role?.replace("_", " ")}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

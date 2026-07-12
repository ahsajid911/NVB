"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, Users, Building2, Stethoscope, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminDoctorsTab } from "@/components/admin/AdminDoctorsTab";
import { AdminHospitalsTab } from "@/components/admin/AdminHospitalsTab";
import { AdminSpecialtiesTab } from "@/components/admin/AdminSpecialtiesTab";
import { useAdminData } from "@/hooks/useAdminData";

type Tab = "overview" | "doctors" | "hospitals" | "specialties";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const {
    stats,
    doctorsList,
    hospitalsList,
    specialtiesList,
    dataLoading,
    fetchStats,
    fetchDoctors,
    fetchHospitals,
    fetchSpecialties,
    fetchAll,
  } = useAdminData();

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    if (activeTab === "doctors") fetchDoctors();
    if (activeTab === "hospitals") fetchHospitals();
    if (activeTab === "specialties") fetchSpecialties();
  }, [activeTab, fetchDoctors, fetchHospitals, fetchSpecialties]);

  const refreshActiveTab = useCallback(() => {
    fetchStats();
    if (activeTab === "doctors") fetchDoctors();
    if (activeTab === "hospitals") fetchHospitals();
    if (activeTab === "specialties") fetchSpecialties();
  }, [activeTab, fetchStats, fetchDoctors, fetchHospitals, fetchSpecialties]);

  const tabs = [
    { id: "overview" as Tab, label: "Overview", icon: BarChart3, count: 0 },
    { id: "doctors" as Tab, label: "Doctors", icon: Users, count: stats.doctors },
    { id: "hospitals" as Tab, label: "Hospitals", icon: Building2, count: stats.hospitals },
    { id: "specialties" as Tab, label: "Specialties", icon: Stethoscope, count: stats.specialties },
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="mt-3 text-lg text-muted-foreground">Manage doctors, hospitals, and specialties data</p>
        </div>
        <Button variant="outline" onClick={refreshActiveTab}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
        <TabsList className="mb-8">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-muted-foreground/20">
                  {tab.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <AdminOverview stats={stats} onRefresh={refreshActiveTab} />
        </TabsContent>

        <TabsContent value="doctors">
          <AdminDoctorsTab doctors={doctorsList} loading={dataLoading} onRefresh={refreshActiveTab} />
        </TabsContent>

        <TabsContent value="hospitals">
          <AdminHospitalsTab hospitals={hospitalsList} loading={dataLoading} onRefresh={refreshActiveTab} />
        </TabsContent>

        <TabsContent value="specialties">
          <AdminSpecialtiesTab specialties={specialtiesList} loading={dataLoading} onRefresh={refreshActiveTab} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

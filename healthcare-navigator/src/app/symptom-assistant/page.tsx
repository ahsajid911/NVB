"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SymptomAssistantPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/ai-symptom-checker");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-muted-foreground">Redirecting to AI Symptom Checker...</p>
    </div>
  );
}

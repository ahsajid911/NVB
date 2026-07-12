import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, color, className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
      <div className={cn("inline-flex items-center justify-center h-12 w-12 rounded-xl", color)}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-4 text-3xl font-semibold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

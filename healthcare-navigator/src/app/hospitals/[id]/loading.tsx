import { Skeleton } from "@/components/ui/skeleton";

export default function HospitalLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
      <Skeleton className="h-6 w-32 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <Skeleton className="h-8 w-64 mb-3" />
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

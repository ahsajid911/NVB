import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorLoading() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-12 lg:px-12">
      <Skeleton className="h-6 w-32 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-5">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-64" />
                <div className="flex gap-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

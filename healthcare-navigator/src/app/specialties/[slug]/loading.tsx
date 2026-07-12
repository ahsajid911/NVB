import { Skeleton } from "@/components/ui/skeleton";

export default function SpecialtyLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
      <Skeleton className="h-6 w-32 mb-6" />
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-3" />
        <Skeleton className="h-5 w-96 mb-3" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

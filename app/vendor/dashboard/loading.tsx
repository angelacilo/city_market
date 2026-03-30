import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Greeting */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-40 rounded" />
        <Skeleton className="h-7 w-64 rounded" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>

      {/* KPI cards — 2x2 on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
            <Skeleton className="h-8 w-8 rounded-lg mb-3" />
            <Skeleton className="h-7 w-16 rounded mb-1" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Two-column panels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent listings */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
          <div className="divide-y divide-gray-50">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-14 rounded" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent inquiries */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
          <div className="divide-y divide-gray-50">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-3 w-36 rounded" />
                </div>
                <Skeleton className="h-3 w-10 rounded flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

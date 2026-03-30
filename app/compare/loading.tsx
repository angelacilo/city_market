import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8 animate-pulse">
      {/* ============================================================ */}
      {/* Product Selector Panel Skeleton                               */}
      {/* ============================================================ */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-shrink-0 space-y-1.5">
              <Skeleton className="h-4 w-44 rounded" />
              <Skeleton className="h-3 w-60 rounded" />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:justify-end">
              {/* Product selector */}
              <Skeleton className="h-11 rounded-xl flex-1 sm:max-w-xs" />
              {/* Market filter */}
              <Skeleton className="h-11 w-40 rounded-xl" />
              {/* Availability pills */}
              <div className="flex gap-2">
                <Skeleton className="h-11 w-28 rounded-xl" />
                <Skeleton className="h-11 w-24 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ============================================================ */}
        {/* Summary Strip Skeleton                                         */}
        {/* ============================================================ */}
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            {[96, 88, 120, 128].map((w, i) => (
              <Skeleton key={i} className={`h-9 w-${w / 4} rounded-xl`} style={{ width: w }} />
            ))}
            <div className="flex items-center gap-1 ml-auto bg-white rounded-xl border border-green-100 p-1">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Table Skeleton                                                  */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-6 px-6 py-3 bg-gray-50 border-b border-gray-100">
            <Skeleton className="h-3 w-6 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-24 rounded ml-auto" />
          </div>
          {/* Rows */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-6 px-6 py-4 border-b border-gray-50 last:border-0"
            >
              <Skeleton className="h-4 w-4 rounded" />
              <div className="space-y-1.5 w-32">
                <Skeleton className="h-3.5 w-28 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <div className="space-y-1.5 w-28">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              <div className="space-y-1.5 w-20">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-3 w-12 rounded" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
              <div className="flex gap-2 ml-auto">
                <Skeleton className="h-9 w-24 rounded-xl" />
                <Skeleton className="h-9 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/* Chart Section Skeleton                                          */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-48 rounded" />
          </div>
          <Skeleton className="h-3 w-64 rounded mb-6" />
          {/* Chart area */}
          <Skeleton className="h-[280px] w-full rounded-xl" />
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {[72, 88, 80, 96, 76, 84].map((w, i) => (
              <Skeleton key={i} className="h-4 rounded-full" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

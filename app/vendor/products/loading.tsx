import { Skeleton } from '@/components/ui/skeleton'

export default function ProductsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-44 rounded-xl" />
          <Skeleton className="h-11 w-28 rounded-xl" />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2">
        {[60, 48, 72, 56].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-full" style={{ width: w }} />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-6 px-5 py-3 bg-gray-50 border-b border-gray-100">
          {[80, 48, 64, 56, 56, 48].map((w, i) => (
            <Skeleton key={i} className="h-3 rounded" style={{ width: w }} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-6 px-5 py-4 border-b border-gray-50 last:border-0">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-6 w-10 rounded-full" />
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="h-8 w-8 rounded-lg ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

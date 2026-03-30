import { Skeleton } from '@/components/ui/skeleton'

export default function PricesLoading() {
  return (
    <div className="space-y-5 max-w-2xl animate-pulse">
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-36 rounded" />
        <Skeleton className="h-3 w-64 rounded" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  )
}

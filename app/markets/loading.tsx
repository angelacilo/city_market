import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function MarketsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white border-b border-gray-100 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64 animate-pulse rounded-2xl" />
            <Skeleton className="h-4 w-48 animate-pulse rounded-full" />
          </div>

          <div className="grid grid-cols-3 gap-8 md:gap-16">
            <div className="space-y-2">
              <Skeleton className="h-10 w-16 animate-pulse rounded-2xl" />
              <Skeleton className="h-3 w-20 animate-pulse rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-10 w-16 animate-pulse rounded-2xl" />
              <Skeleton className="h-3 w-20 animate-pulse rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-10 w-16 animate-pulse rounded-2xl" />
              <Skeleton className="h-3 w-20 animate-pulse rounded-full" />
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar Skeleton */}
      <div className="sticky top-[64px] z-30 bg-white border-b border-gray-100 shadow-sm px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4">
          <Skeleton className="h-11 flex-grow animate-pulse rounded-2xl" />
          <div className="flex gap-2 overflow-x-hidden">
             {[1,2,3,4,5].map(i => (
                <Skeleton key={i} className="h-11 w-24 animate-pulse rounded-full flex-shrink-0" />
             ))}
          </div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-full overflow-hidden border-gray-100 shadow-sm rounded-3xl">
              <Skeleton className="h-[160px] w-full animate-pulse rounded-none" />
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                   <Skeleton className="h-8 w-48 animate-pulse rounded-2xl" />
                   <Skeleton className="h-4 w-32 animate-pulse rounded-full" />
                </div>
                <div className="flex gap-6">
                   <Skeleton className="h-8 w-16 animate-pulse rounded-xl" />
                   <Skeleton className="h-8 w-16 animate-pulse rounded-xl" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

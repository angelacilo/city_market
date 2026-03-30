import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function MarketDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Skeleton */}
      <Skeleton className="h-[25vh] sm:h-[40vh] w-full animate-pulse rounded-none" />

      {/* Info Card Skeleton Overlay */}
      <section className="relative max-w-6xl mx-auto w-full px-4 -mt-32 sm:-mt-52 z-10 pb-20">
        <Card className="rounded-[2.5rem] bg-white border-transparent shadow-2xl p-8 sm:p-16 space-y-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="space-y-6 flex-1">
               <Skeleton className="h-4 w-32 animate-pulse rounded-full" />
               <div className="space-y-4">
                  <Skeleton className="h-16 w-3/4 animate-pulse rounded-2xl" />
                  <div className="flex gap-4">
                     <Skeleton className="h-8 w-48 animate-pulse rounded-full" />
                     <Skeleton className="h-8 w-24 animate-pulse rounded-full" />
                     <Skeleton className="h-8 w-24 animate-pulse rounded-full" />
                  </div>
               </div>
               <Skeleton className="h-24 w-full animate-pulse rounded-[2rem]" />
            </div>

            <div className="flex flex-col gap-4 w-full lg:w-72">
               <Skeleton className="h-16 w-full animate-pulse rounded-2xl" />
               <Skeleton className="h-16 w-full animate-pulse rounded-2xl" />
            </div>
          </div>

          <div className="space-y-8 pt-12 border-t border-gray-50">
             <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-48 animate-pulse rounded-2xl" />
                <Skeleton className="h-6 w-16 animate-pulse rounded-full" />
             </div>
             <div className="flex gap-2 overflow-x-hidden">
                {[1,2,3,4,5].map(i => (
                   <Skeleton key={i} className="h-10 w-24 animate-pulse rounded-2xl flex-shrink-0" />
                ))}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                   <Card key={i} className="rounded-[2.5rem] p-8 space-y-6 border-gray-50">
                      <div className="flex items-start justify-between">
                         <div className="flex gap-3">
                            <Skeleton className="h-12 w-12 animate-pulse rounded-3xl" />
                            <div className="space-y-2">
                               <Skeleton className="h-4 w-16 animate-pulse rounded-full" />
                               <Skeleton className="h-6 w-32 animate-pulse rounded-full" />
                            </div>
                         </div>
                         <Skeleton className="h-6 w-16 animate-pulse rounded-full" />
                      </div>
                      <Skeleton className="h-32 w-full animate-pulse rounded-[2rem]" />
                      <Skeleton className="h-14 w-full animate-pulse rounded-2xl" />
                   </Card>
                ))}
             </div>
          </div>
        </Card>
      </section>
    </div>
  )
}

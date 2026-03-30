import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function SearchLoading() {
  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Sticky Header Skeleton */}
      <div className="sticky top-[64px] z-30 bg-white border-b border-gray-100 py-6 px-4 sm:px-6 shadow-sm">
         <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Skeleton className="h-10 w-10 animate-pulse rounded-full" />
               <Skeleton className="h-8 w-48 animate-pulse rounded-xl" />
            </div>
            <Skeleton className="h-6 w-32 animate-pulse rounded-full" />
         </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="sticky top-[132px] sm:top-[128px] z-20 bg-white border-b border-gray-100 py-4 px-4 sm:px-6">
         <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4">
            <Skeleton className="w-full sm:w-[200px] h-11 animate-pulse rounded-full" />
            <Skeleton className="w-full sm:w-[240px] h-11 animate-pulse rounded-full" />
            <div className="flex gap-2 w-full sm:w-auto sm:ml-auto overflow-hidden">
               <Skeleton className="w-32 h-11 animate-pulse rounded-full" />
               <Skeleton className="w-32 h-11 animate-pulse rounded-full" />
            </div>
         </div>
      </div>

      <div className="px-4 sm:px-6 py-12 space-y-12 w-full">
         {/* Summary Strip Skeleton */}
         <div className="w-full bg-green-50/50 border border-green-100/50 rounded-3xl p-4 sm:p-6 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
            <div className="flex gap-4 items-center">
               <div className="space-y-2">
                  <Skeleton className="h-4 w-16 animate-pulse rounded-full" />
                  <Skeleton className="h-6 w-24 animate-pulse rounded-full" />
               </div>
               <div className="w-px h-8 bg-green-100 hidden sm:block" />
               <div className="space-y-2">
                  <Skeleton className="h-4 w-16 animate-pulse rounded-full" />
                  <Skeleton className="h-6 w-24 animate-pulse rounded-full" />
               </div>
            </div>
            <div className="w-full lg:w-px h-px lg:h-8 bg-green-100" />
            <div className="flex gap-4 items-center">
               <div className="space-y-2 lg:items-end flex flex-col">
                  <Skeleton className="h-4 w-16 animate-pulse rounded-full" />
                  <Skeleton className="h-8 w-32 animate-pulse rounded-full" />
               </div>
               <div className="w-px h-8 bg-green-100 hidden sm:block" />
               <div className="space-y-2 lg:items-end flex flex-col">
                  <Skeleton className="h-4 w-16 animate-pulse rounded-full" />
                  <Skeleton className="h-6 w-24 animate-pulse rounded-full" />
               </div>
            </div>
         </div>

         {/* Market Sections */}
         <div className="space-y-16">
            {[1, 2].map(sectionIndex => (
               <div key={sectionIndex} className="space-y-6">
                  {/* Market Title */}
                  <div className="flex items-center gap-3">
                     <Skeleton className="h-8 w-48 animate-pulse rounded-xl" />
                     <Skeleton className="h-6 w-10 animate-pulse rounded-full" />
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                     {[1, 2, 3].map(cardIndex => (
                        <Card key={cardIndex} className="p-6 sm:p-8 space-y-6 rounded-3xl border-gray-100">
                           <div className="space-y-2">
                              <Skeleton className="h-6 w-3/4 animate-pulse rounded-full" />
                              <Skeleton className="h-4 w-1/4 animate-pulse rounded-full" />
                           </div>
                           <Skeleton className="h-32 w-full animate-pulse rounded-[2rem]" />
                           <div className="space-y-2">
                              <Skeleton className="h-6 w-1/2 animate-pulse rounded-full" />
                              <Skeleton className="h-4 w-1/3 animate-pulse rounded-full" />
                           </div>
                           <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50 mt-auto">
                              <Skeleton className="h-12 sm:h-14 animate-pulse rounded-xl sm:rounded-2xl" />
                              <Skeleton className="h-12 sm:h-14 animate-pulse rounded-xl sm:rounded-2xl" />
                           </div>
                        </Card>
                     ))}
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  )
}

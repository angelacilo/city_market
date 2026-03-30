import { Skeleton } from '@/components/ui/skeleton'

export default function InquiriesLoading() {
  return (
    <div className="-mx-4 -my-6 sm:-mx-6 flex h-[calc(100vh-56px-48px)] md:h-[calc(100vh-56px)] overflow-hidden animate-pulse">
      {/* List column */}
      <div className="w-full md:w-80 border-r border-gray-100 bg-white flex flex-col flex-shrink-0">
        <div className="px-4 py-4 border-b border-gray-100 space-y-3">
          <Skeleton className="h-5 w-28 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-12 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        </div>
        <div className="flex-1 divide-y divide-gray-50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-3 w-36 rounded" />
              </div>
              <Skeleton className="h-3 w-8 rounded flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Detail column */}
      <div className="flex-1 bg-white p-6 space-y-5 hidden md:block">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-3 w-44 rounded" />
        <div className="flex gap-3">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

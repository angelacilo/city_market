import { Skeleton } from '@/components/ui/skeleton'

export default function ProfileLoading() {
  return (
    <div className="max-w-lg space-y-6 animate-pulse">
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-28 rounded" />
        <Skeleton className="h-3 w-52 rounded" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        ))}

        <Skeleton className="h-11 w-full rounded-xl mt-2" />
      </div>
    </div>
  )
}

import { Skeleton } from '@/components/ui/skeleton'

export default function LoginLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-7 w-56 rounded" />
        <Skeleton className="h-4 w-72 rounded" />
      </div>
      <Skeleton className="h-px w-full" />

      {/* Fields */}
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <div className="flex justify-end">
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>

      {/* Sign-up link */}
      <div className="flex justify-center gap-2">
        <Skeleton className="h-4 w-36 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>
    </div>
  )
}

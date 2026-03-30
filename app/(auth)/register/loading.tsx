import { Skeleton } from '@/components/ui/skeleton'

export default function RegisterLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-36 rounded" />
        <Skeleton className="h-7 w-48 rounded" />
        <Skeleton className="h-4 w-80 rounded" />
      </div>
      <Skeleton className="h-px w-full" />

      {/* Info banner */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Group 1 */}
      <div className="space-y-4">
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>

      <Skeleton className="h-px w-full" />

      {/* Group 2 */}
      <div className="space-y-4">
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>

      <Skeleton className="h-px w-full" />

      {/* Group 3 */}
      <div className="space-y-4">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>

      <Skeleton className="h-px w-full" />

      {/* Checkbox */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-4 w-4 rounded flex-shrink-0 mt-0.5" />
        <Skeleton className="h-8 flex-1 rounded" />
      </div>

      {/* Button */}
      <Skeleton className="h-11 w-full rounded-lg" />

      {/* Sign-in link */}
      <div className="flex justify-center gap-2">
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>
    </div>
  )
}

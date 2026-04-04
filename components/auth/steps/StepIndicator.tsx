'use client'

import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  current: 1 | 2 | 3
}

export default function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-2">
      {[1, 2, 3].map((step) => (
        <div
          key={step}
          className={cn(
            'rounded-full transition-all duration-300',
            step === current
              ? 'bg-green-700 w-2.5 h-2.5'
              : step < current
                ? 'bg-green-400 w-2 h-2'
                : 'bg-gray-200 w-2 h-2'
          )}
        />
      ))}
    </div>
  )
}

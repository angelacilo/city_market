'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export default function SuccessView() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center text-center space-y-4 py-4">
      {/* Animated checkmark */}
      <div className="w-[72px] h-[72px] rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center animate-in zoom-in-50 duration-500">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mt-6">
        Password updated!
      </h2>

      <p className="text-sm text-gray-500 text-center leading-relaxed max-w-xs">
        Your new password has been saved. You can now sign in to your vendor
        account.
      </p>

      <Button
        onClick={() => router.push('/login')}
        className="bg-green-700 hover:bg-green-800 text-white rounded-full h-11 px-8 text-sm font-semibold mt-6"
      >
        Sign in now
      </Button>

      <p className="text-xs text-gray-400 text-center mt-2">
        Your account is ready to use
      </p>
    </div>
  )
}

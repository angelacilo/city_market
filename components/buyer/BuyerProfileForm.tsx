'use client'
import { User } from 'lucide-react'

export default function BuyerProfileForm() {
  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl border shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <User className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-black">Personal Account</h2>
      </div>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Profile management settings for buyers.</p>
      </div>
    </div>
  )
}

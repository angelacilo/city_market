'use client'
import { Bell } from 'lucide-react'

export default function PriceAlertsManager() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-green-700" />
        <h2 className="text-xl font-bold">Price Alerts</h2>
      </div>
      <div className="text-sm text-gray-500">You will be notified when products in your watchlist drop below your target price.</div>
    </div>
  )
}

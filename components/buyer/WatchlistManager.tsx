'use client'
import { Eye } from 'lucide-react'

export default function WatchlistManager() {
  return (
    <div className="p-6">
       <div className="flex items-center gap-3 mb-6">
        <Eye className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold">Watchlist</h2>
      </div>
      <div className="p-10 border rounded-2xl text-center text-gray-400">
        No items in your watchlist.
      </div>
    </div>
  )
}

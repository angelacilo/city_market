'use client'
import { ShoppingBasket } from 'lucide-react'

export default function CanvassManager() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl">
          <ShoppingBasket className="w-8 h-8 text-green-700" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Market Canvass</h1>
          <p className="text-gray-500 text-sm">Your personal budget planning list</p>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-12 text-center border border-dashed">
        Your canvass list is currently empty. Start adding products from the market!
      </div>
    </div>
  )
}

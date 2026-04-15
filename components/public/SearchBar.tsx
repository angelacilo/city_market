'use client'
import { Search } from 'lucide-react'

export default function SearchBar() {
  return (
    <div className="relative group w-full max-w-xl">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input 
        type="text" 
        placeholder="Search for products or stalls..."
        className="w-full h-12 pl-12 pr-6 rounded-2xl bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold text-sm"
      />
    </div>
  )
}

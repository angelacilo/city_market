'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  'All',
  'Vegetables',
  'Meat',
  'Seafood',
  'Rice',
  'Fruits',
  'Dry Goods',
  'Condiments',
]

interface MarketsFilterBarProps {
  onFilterChange: (search: string, category: string) => void
}

export default function MarketsFilterBar({ onFilterChange }: MarketsFilterBarProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const handleSearchChange = (val: string) => {
    setSearch(val)
    onFilterChange(val, activeCategory)
  }

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat)
    onFilterChange(search, cat)
  }

  return (
    <div className="bg-white dark:bg-[#0a0f0a] rounded-2xl border border-gray-100 dark:border-white/5 p-3 shadow-sm dark:shadow-[0_0_30px_-5px_rgba(27,107,62,0.15)] flex flex-col md:flex-row items-center gap-3 transition-all duration-500">
      {/* Search Input */}
      <div className="relative w-full md:w-[35%]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search specific products or specific markets..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border-none bg-transparent pl-10 h-10 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="w-full md:flex-1 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max px-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={cn(
                'px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap',
                activeCategory === cat
                  ? 'bg-green-700 dark:bg-green-600 text-white shadow-lg shadow-green-500/20'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

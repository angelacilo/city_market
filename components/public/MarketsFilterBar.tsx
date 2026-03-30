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
    <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm flex flex-col md:flex-row items-center gap-3">
      {/* Search Input */}
      <div className="relative w-full md:w-[35%]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search specific products or specific markets..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border-none bg-transparent pl-10 h-10 text-sm placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                activeCategory === cat
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

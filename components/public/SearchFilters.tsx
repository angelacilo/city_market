'use client'

import { useState, useMemo, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface SearchFiltersProps {
  markets: string[]
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  sortStr: string
  market: string
  availability: 'in-stock' | 'all'
}

export default function SearchFilters({ markets, onFilterChange }: SearchFiltersProps) {
  const [sortStr, setSortStr] = useState('price-low')
  const [market, setMarket] = useState('all')
  const [availability, setAvailability] = useState<'in-stock' | 'all'>('all')

  // We use useEffect to notify the parent whenever local filter state changes
  useEffect(() => {
    onFilterChange({ sortStr, market, availability })
  }, [sortStr, market, availability, onFilterChange])

  return (
    <div className="bg-white border-b border-gray-100 py-3 px-4 sm:px-6 z-20 sticky top-[132px] sm:top-[128px]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        {/* Sort Order Selector */}
        <div className="w-full sm:w-auto">
          <Select value={sortStr} onValueChange={setSortStr}>
            <SelectTrigger className="w-full sm:w-[200px] h-11 rounded-full border-gray-200 bg-gray-50 focus:ring-green-600 font-bold text-xs uppercase tracking-widest italic text-gray-700">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-gray-100">
              <SelectItem value="price-low" className="font-bold text-xs uppercase tracking-widest italic">Price: Low to High</SelectItem>
              <SelectItem value="price-high" className="font-bold text-xs uppercase tracking-widest italic">Price: High to Low</SelectItem>
              <SelectItem value="market-az" className="font-bold text-xs uppercase tracking-widest italic">Market Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Market Filter */}
        <div className="w-full sm:w-auto">
          <Select value={market} onValueChange={setMarket}>
            <SelectTrigger className="w-full sm:w-[240px] h-11 rounded-full border-gray-200 bg-gray-50 focus:ring-green-600 font-bold text-xs uppercase tracking-widest italic text-gray-700">
              <SelectValue placeholder="Select market" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-gray-100">
              <SelectItem value="all" className="font-bold text-xs uppercase tracking-widest italic">All markets</SelectItem>
              {markets.map((m) => (
                <SelectItem key={m} value={m} className="font-bold text-xs uppercase tracking-widest italic">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Availability Toggle */}
        <div className="flex w-full sm:w-auto overflow-x-auto gap-2 sm:ml-auto no-scrollbar pb-1 sm:pb-0">
           <Badge 
             variant={availability === 'in-stock' ? 'default' : 'outline'}
             className={`cursor-pointer whitespace-nowrap h-11 px-6 rounded-full font-bold text-xs uppercase tracking-widest italic transition-all ${
               availability === 'in-stock' 
                 ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' 
                 : 'bg-white hover:bg-gray-50 text-gray-400 border-gray-200'
             }`}
             onClick={() => setAvailability('in-stock')}
           >
             In stock only
           </Badge>
           <Badge 
             variant={availability === 'all' ? 'default' : 'outline'}
             className={`cursor-pointer whitespace-nowrap h-11 px-6 rounded-full font-bold text-xs uppercase tracking-widest italic transition-all ${
               availability === 'all' 
                 ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' 
                 : 'bg-white hover:bg-gray-50 text-gray-400 border-gray-200'
             }`}
             onClick={() => setAvailability('all')}
           >
             Show all
           </Badge>
        </div>
      </div>
    </div>
  )
}

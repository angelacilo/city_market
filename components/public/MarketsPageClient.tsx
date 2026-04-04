'use client'

import { useState, useMemo } from 'react'
import MarketsFilterBar from './MarketsFilterBar'
import MarketCard from './MarketCard'

  interface Market {
  id: string
  name: string
  vendors_count: number
  products_count: number
  image_url?: string | null
  product_names?: string[]
}

interface MarketsPageClientProps {
  initialMarkets: Market[]
}

export default function MarketsPageClient({ initialMarkets }: MarketsPageClientProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const filteredMarkets = useMemo(() => {
    const term = search.toLowerCase().trim()
    return initialMarkets.filter((market) => {
      const matchesSearch = 
        market.name.toLowerCase().includes(term) ||
        (market.product_names || []).some(pn => pn.toLowerCase().includes(term))
      
      // Note: Real category filtering would requires market-category mapping.
      // For now, we perform search.
      return matchesSearch
    })
  }, [initialMarkets, search, category])

  return (
    <>
      <div className="mt-10">
        <MarketsFilterBar 
          onFilterChange={(s, c) => {
            setSearch(s)
            setCategory(c)
          }} 
        />
      </div>

      <div className="pt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarkets.map((market, index) => (
            <MarketCard key={market.id} market={market} index={index} />
          ))}
        </div>
      </div>
    </>
  )
}

'use client'

import { useState, useMemo, useCallback } from 'react'
import SearchFilters, { FilterState } from './SearchFilters'
import SearchResultsGrid from './SearchResultsGrid'

export interface SearchListing {
  id: string
  price: number
  is_available: boolean
  vendor_id: string
  products: {
    name: string
    unit: string
    categories: {
      name: string
    } | null | any
  } | null | any
  vendors: {
    business_name: string
    stall_number: string | null
    contact_number: string | null
  } | null | any
  markets: {
    name: string
    barangay: string | null
  } | null | any
}

interface SearchResultsWrapperProps {
  initialListings: SearchListing[]
  lowestPrice: number
  highestPrice: number
  marketCount: number
  vendorCount: number
  availableMarkets: string[]
}

export default function SearchResultsWrapper({
  initialListings,
  lowestPrice,
  highestPrice,
  marketCount,
  vendorCount,
  availableMarkets,
}: SearchResultsWrapperProps) {
  const [filters, setFilters] = useState<FilterState>({
    sortStr: 'price-low',
    market: 'all',
    availability: 'in-stock',
  })

  const [filteredListings, setFilteredListings] = useState<SearchListing[]>(initialListings)

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)

    let results = [...initialListings]

    // 1. Availability filter (Server query uses is_available=true already, but we handle it anyway)
    if (newFilters.availability === 'in-stock') {
      results = results.filter((listing) => listing.is_available)
    }

    // 2. Market filter
    if (newFilters.market !== 'all') {
      results = results.filter((listing) => listing.markets?.name === newFilters.market)
    }

    // 3. Sorting
    if (newFilters.sortStr === 'price-low') {
      results.sort((a, b) => a.price - b.price)
    } else if (newFilters.sortStr === 'price-high') {
      results.sort((a, b) => b.price - a.price)
    } else if (newFilters.sortStr === 'market-az') {
      results.sort((a, b) => {
         const m1 = a.markets?.name || ''
         const m2 = b.markets?.name || ''
         if (m1 === m2) return a.price - b.price // fallback
         return m1.localeCompare(m2)
      })
    }

    setFilteredListings(results)
  }, [initialListings])

  // Calculate dynamic stats for the summary strip
  const currentLowestPrice = filteredListings.length > 0
    ? Math.min(...filteredListings.map(l => l.price))
    : 0
  const currentBestMarket = filteredListings.length > 0
    ? filteredListings.reduce((min, l) => l.price < min.price ? l : min, filteredListings[0]).markets?.name || 'Unknown'
    : 'None'
  const currentMarketsCount = new Set(filteredListings.map(l => l.markets?.name)).size

  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full">
      <div className="sticky top-[73px] sm:top-[64px] z-20">
         <SearchFilters 
          markets={availableMarkets} 
          onFilterChange={handleFilterChange} 
         />
      </div>
      
      <div className="px-4 sm:px-6 py-12 pb-20 md:pb-0 min-h-screen">
        <SearchResultsGrid
          listings={filteredListings}
          lowestPrice={lowestPrice}
          highestPrice={highestPrice}
          currentLowestPrice={currentLowestPrice}
          currentMarketsCount={currentMarketsCount}
          currentBestMarket={currentBestMarket}
          onClearFilters={() => handleFilterChange({ sortStr: 'price-low', market: 'all', availability: 'in-stock' })}
        />
      </div>
    </div>
  )
}

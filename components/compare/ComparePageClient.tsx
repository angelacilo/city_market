'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ComparisonListing, ProductWithCategory } from '@/lib/queries/compare'
import InquiryTrigger from '@/components/public/InquiryTrigger'
import PriceTrendChart from '@/components/compare/PriceTrendChart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

import {
  Loader2,
  PackageOpen,
  Store,
  Sparkles,
  CheckCircle2,
  Search,
  X,
  MapPin,
  Check,
} from 'lucide-react'
import Link from 'next/link'

/* ------------------------------------------------------------------ */
/* Types                                                                 */
/* ------------------------------------------------------------------ */

interface ComparePageClientProps {
  initialProducts: ProductWithCategory[]
  initialListings: ComparisonListing[]
  initialProductId?: string | null
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function formatPeso(amount: number): string {
  return `₱${amount.toFixed(2)}`
}

function groupByCategory(products: ProductWithCategory[]): Record<string, ProductWithCategory[]> {
  return products.reduce<Record<string, ProductWithCategory[]>>((acc, p) => {
    const cat = p.categories?.name ?? 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})
}


/* ------------------------------------------------------------------ */
/* Product Search Bar Component                                         */
/* ------------------------------------------------------------------ */

function ProductSearchBar({
  products,
  productGroups,
  sortedCategories,
  selectedProductId,
  onSelect,
  onClear,
  loading,
}: {
  products: ProductWithCategory[]
  productGroups: Record<string, ProductWithCategory[]>
  sortedCategories: string[]
  selectedProductId: string | null
  onSelect: (id: string) => void
  onClear: () => void
  loading: boolean
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedProduct = selectedProductId
    ? products.find((p) => p.id === selectedProductId)
    : null

  // Filter products by search query
  const filteredGroups = useMemo(() => {
    if (!query.trim()) return productGroups
    const q = query.toLowerCase()
    const result: Record<string, ProductWithCategory[]> = {}
    for (const cat of sortedCategories) {
      const filtered = (productGroups[cat] || []).filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          cat.toLowerCase().includes(q)
      )
      if (filtered.length > 0) result[cat] = filtered
    }
    return result
  }, [query, productGroups, sortedCategories])

  const filteredCategories = Object.keys(filteredGroups).sort()
  const totalResults = Object.values(filteredGroups).reduce((s, arr) => s + arr.length, 0)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(id: string) {
    onSelect(id)
    setQuery('')
    setIsOpen(false)
  }

  function handleClear() {
    onClear()
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* If a product is selected, show it as a chip */}
      {selectedProduct && !isOpen ? (
        <div className="flex items-center h-12 rounded-xl border border-green-300 bg-green-50 px-4 gap-2">
          <Search className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="text-sm font-semibold text-green-800 truncate flex-1">
            {selectedProduct.name}
            <span className="text-green-600/60 font-normal ml-1">({selectedProduct.unit})</span>
          </span>
          {loading ? (
            <Loader2 className="w-4 h-4 text-green-600 animate-spin flex-shrink-0" />
          ) : (
            <button
              type="button"
              onClick={handleClear}
              className="flex-shrink-0 w-5 h-5 rounded-full bg-green-200 hover:bg-green-300 flex items-center justify-center transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-3 h-3 text-green-800" />
            </button>
          )}
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search for a product (e.g., Apple, Rice)"
            className="w-full h-12 pl-11 pr-10 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}
          {loading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600 animate-spin" />
          )}
        </div>
      )}

      {/* Dropdown results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-72 overflow-y-auto">
          {totalResults === 0 ? (
            <div className="px-4 py-6 text-center">
              <PackageOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-500">No products found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat}>
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 sticky top-0 border-b border-gray-100">
                  {cat}
                </div>
                {filteredGroups[cat].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p.id)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 transition-colors flex items-center gap-2 ${
                      p.id === selectedProductId
                        ? 'bg-green-50 text-green-800 font-bold'
                        : 'text-gray-700 font-medium'
                    }`}
                  >
                    <span className="flex-1">{p.name}</span>
                    <span className="text-xs text-gray-400">({p.unit})</span>
                    {p.id === selectedProductId && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main Component                                                        */
/* ------------------------------------------------------------------ */

export default function ComparePageClient({
  initialProducts,
  initialListings,
  initialProductId,
}: ComparePageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    initialProductId ?? searchParams.get('product') ?? null
  )
  const [listings, setListings] = useState<ComparisonListing[]>(initialListings)
  const [loading, setLoading] = useState(false)
  const [activeMarketFilter, setActiveMarketFilter] = useState<string>('all')
  const [inStockOnly, setInStockOnly] = useState(true)

  /* ---- Fetch listings when product changes ---- */
  const fetchListings = useCallback(async (productId: string) => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('price_listings')
      .select(`
        id, price, is_available, last_updated, vendor_id, market_id, product_id,
        products ( id, name, unit ),
        vendors ( id, business_name, stall_number, contact_number, owner_name ),
        markets ( id, name, barangay, address )
      `)
      .eq('product_id', productId)
      .order('price', { ascending: true })

    setListings((data as unknown as ComparisonListing[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!selectedProductId) {
      setListings([])
      return
    }
    if (initialListings.length > 0 && selectedProductId === initialProductId) {
      return
    }
    fetchListings(selectedProductId)
  }, [selectedProductId]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Handle product selection ---- */
  function handleProductSelect(productId: string) {
    setSelectedProductId(productId)
    setActiveMarketFilter('all')
    setInStockOnly(true)
    router.push(`/compare?product=${productId}`, { scroll: false } as any)
  }

  function handleClearProduct() {
    setSelectedProductId(null)
    setListings([])
    setActiveMarketFilter('all')
    setInStockOnly(true)
    router.push('/compare', { scroll: false } as any)
  }

  /* ---- Derive unique markets from ALL listings (not filtered) ---- */
  const allMarkets = useMemo(() => {
    const names = new Set(listings.map((l) => l.markets?.name).filter(Boolean) as string[])
    return Array.from(names).sort()
  }, [listings])

  /* ---- Filtered listings ---- */
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      if (activeMarketFilter !== 'all' && l.markets?.name !== activeMarketFilter) return false
      if (inStockOnly && !l.is_available) return false
      return true
    })
  }, [listings, activeMarketFilter, inStockOnly])

  /* ---- Compute summary stats ---- */
  const stats = useMemo(() => {
    if (filteredListings.length === 0) return null
    const prices = filteredListings.map((l) => l.price)
    return {
      totalListings: filteredListings.length,
      uniqueMarkets: new Set(filteredListings.map((l) => l.markets?.name).filter(Boolean)).size,
      lowestPrice: Math.min(...prices),
      highestPrice: Math.max(...prices),
    }
  }, [filteredListings])

  const lowestPrice = stats?.lowestPrice ?? null

  /* ---- Product groups ---- */
  const productGroups = useMemo(() => groupByCategory(initialProducts), [initialProducts])
  const sortedCategories = Object.keys(productGroups).sort()

  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#fafcfa] pb-20 md:pb-8">
      {/* ============================================================ */}
      {/* Hero Header                                                    */}
      {/* ============================================================ */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-2">
            Compare Prices Across<br />Markets
          </h1>
          <p className="text-gray-500 text-sm font-medium max-w-lg">
            Find the best deals on fresh produce and essential goods in Butuan City.
          </p>
        </div>

        {/* Search Controls Bar */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            {/* Product Search */}
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">
                Product Search
              </label>
              <ProductSearchBar
                products={initialProducts}
                productGroups={productGroups}
                sortedCategories={sortedCategories}
                selectedProductId={selectedProductId}
                onSelect={handleProductSelect}
                onClear={handleClearProduct}
                loading={loading}
              />
            </div>

            {/* Location dropdown */}
            <div className="sm:w-44">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">
                Location
              </label>
              <Select value={activeMarketFilter} onValueChange={setActiveMarketFilter}>
                <SelectTrigger className="h-12 rounded-xl border-gray-200 font-medium text-sm">
                  <SelectValue placeholder="All Markets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Markets</SelectItem>
                  {allMarkets.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* In Stock + Compare btn */}
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 h-12 px-3 cursor-pointer select-none">
                <div
                  onClick={() => setInStockOnly(!inStockOnly)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                    inStockOnly
                      ? 'bg-green-700 border-green-700'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {inStockOnly && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <span className="text-xs font-semibold text-gray-600 whitespace-nowrap leading-none">
                  In<br />Stock<br />Only
                </span>
              </label>
              <Button
                className="h-12 px-6 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-sm uppercase tracking-wide"
                onClick={() => {
                  if (selectedProductId) fetchListings(selectedProductId)
                }}
              >
                Compare
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Main Content Area                                             */}
      {/* ============================================================ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

        {/* ============================================================ */}
        {/* Empty State — No product selected                            */}
        {/* ============================================================ */}
        {!selectedProductId && !loading && (
          <div className="flex flex-col items-center justify-center text-center py-20 px-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-5 border border-green-100">
              <Search className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Search for a product to compare prices
            </h2>
            <p className="text-gray-400 max-w-md mx-auto text-sm font-medium leading-relaxed">
              Use the search bar above to find any product and instantly see pricing across all Butuan markets.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-4" />
            <p className="text-sm font-medium text-gray-500">Looking up prices across all markets…</p>
          </div>
        )}

        {/* No listings found */}
        {selectedProductId && !loading && listings.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <PackageOpen className="w-14 h-14 text-gray-300 mb-5" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              No listings found for this product
            </h2>
            <p className="text-gray-400 max-w-md mx-auto text-sm font-medium leading-relaxed mb-6">
              None of the vendors are currently listing this product. Try a different one.
            </p>
            <Button
              variant="outline"
              className="h-10 px-5 font-semibold text-sm border-gray-200 hover:border-green-300 hover:text-green-700"
              onClick={handleClearProduct}
            >
              Clear selection
            </Button>
          </div>
        )}

        {/* ============================================================ */}
        {/* Results                                                       */}
        {/* ============================================================ */}
        {selectedProductId && !loading && listings.length > 0 && (
          <>
            {/* Summary strip */}
            {stats && (
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Results:</span>
                  <span className="text-gray-900">{stats.totalListings} Listings</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Coverage:</span>
                  <span className="text-gray-900">{stats.uniqueMarkets} Markets</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-gray-400">Best Price:</span>
                  <Badge className="bg-green-700 text-white font-bold text-xs px-2.5 py-0.5 rounded-md">
                    {formatPeso(stats.lowestPrice)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Most Expensive:</span>
                  <Badge variant="outline" className="text-gray-600 border-gray-300 font-bold text-xs px-2.5 py-0.5 rounded-md">
                    {formatPeso(stats.highestPrice)}
                  </Badge>
                </div>
              </div>
            )}

            {/* Filtered empty */}
            {filteredListings.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <PackageOpen className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500">No listings match your filters.</p>
                <Button
                  variant="ghost"
                  className="mt-3 text-green-600 text-xs font-bold uppercase h-9"
                  onClick={() => { setActiveMarketFilter('all'); setInStockOnly(false) }}
                >
                  Reset filters
                </Button>
              </div>
            )}

            {/* Cards */}
            {filteredListings.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredListings.map((listing) => {
                  const isBest = listing.price === lowestPrice
                  return (
                    <div
                      key={listing.id}
                      className={`relative bg-white rounded-2xl overflow-hidden transition-all hover:shadow-md ${
                        isBest
                          ? 'border-2 border-green-600 shadow-sm'
                          : 'border border-gray-100 shadow-sm'
                      }`}
                    >
                      <div className="p-6">
                        {/* Market name + price */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">
                              {listing.markets?.name ?? '—'}
                            </h3>
                            <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {listing.markets?.barangay ? `Brgy. ${listing.markets.barangay}` : 'Butuan City'}
                            </p>
                          </div>
                          <div className="text-right">
                            {isBest && (
                              <Badge className="bg-green-600 text-white text-[10px] px-2 py-0.5 font-bold uppercase tracking-wide mb-1">
                                Best Deal
                              </Badge>
                            )}
                            <p className={`text-2xl font-black tracking-tight ${isBest ? 'text-green-700' : 'text-gray-900'}`}>
                              {formatPeso(listing.price)}
                            </p>
                            <p className="text-xs text-gray-400 font-medium uppercase">
                              per {listing.products?.unit ?? 'unit'}
                            </p>
                          </div>
                        </div>

                        {/* Vendor info */}
                        <div className="flex items-center gap-2 mb-3">
                          <Store className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-700">
                            {listing.vendors?.business_name ?? '—'}
                          </span>
                          {listing.vendors?.stall_number && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span className="text-xs text-gray-400 font-medium">
                                Stall {listing.vendors.stall_number}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Availability */}
                        {listing.is_available && (
                          <div className="flex items-center gap-1.5 mb-4">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-xs font-semibold text-green-700 uppercase">In Stock</span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            asChild
                            size="sm"
                            className="h-10 flex-1 bg-green-700 hover:bg-green-800 text-white text-xs font-bold uppercase tracking-wide rounded-lg"
                          >
                            <Link href={`/markets/${listing.market_id}`}>
                              Go to Market
                            </Link>
                          </Button>
                          <InquiryTrigger
                            vendorId={listing.vendor_id}
                            listingId={listing.id}
                            productName={listing.products?.name ?? ''}
                            vendorName={listing.vendors?.business_name ?? ''}
                            marketName={listing.markets?.name ?? ''}
                            price={listing.price}
                            unit={listing.products?.unit ?? 'unit'}
                            triggerLabel="Ask Vendor"
                            triggerVariant="outline"
                            triggerSize="sm"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Price Trend Chart */}
            {selectedProductId && (
              <PriceTrendChart productId={selectedProductId} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

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
 
import {
  Loader2,
  PackageOpen,
  Store,
  CheckCircle2,
  Search,
  X,
  MapPin,
  Check,
  ShoppingBag,
  TrendingUp,
  LayoutDashboard,
  LineChart,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
 
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

  // Handle Enter keypress
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (totalResults > 0) {
        // Find the first product in the first category
        const firstCat = filteredCategories[0]
        const firstProd = filteredGroups[firstCat][0]
        handleSelect(firstProd.id)
      } else if (query.trim()) {
        setIsOpen(true) // Ensure the "not found" state is visible
      }
    }
  }
 
  return (
    <div ref={containerRef} className="relative flex-1">
      {/* If a product is selected, show it as a chip */}
      {selectedProduct && !isOpen ? (
        <div className="flex items-center h-14 rounded-xl border border-[#1b6b3e]/20 dark:border-green-500/10 bg-[#1b6b3e]/5 dark:bg-green-500/5 px-4 gap-2">
          <ShoppingBag className="w-5 h-5 text-[#1b6b3e]/60 dark:text-green-500/40 flex-shrink-0" />
          <span className="text-sm font-bold text-gray-900 dark:text-white truncate flex-1 text-left">
            {selectedProduct.name}
            <span className="text-gray-400 dark:text-gray-600 font-medium ml-1">({selectedProduct.unit})</span>
          </span>
          {loading ? (
            <Loader2 className="w-4 h-4 text-[#1b6b3e] animate-spin flex-shrink-0" />
          ) : (
            <button
              type="button"
              onClick={handleClear}
              className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          )}
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1b6b3e]/60 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Rice, Chicken, Tomatoes..."
            className="w-full h-14 pl-12 pr-10 rounded-xl border-none bg-gray-100 dark:bg-white/5 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1b6b3e]/20 transition-all shadow-inner"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200/50 hover:bg-gray-200 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          )}
          {loading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1b6b3e] animate-spin" />
          )}
        </div>
      )}
 
      {/* Dropdown results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0a0f0a] rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl z-50 max-h-80 overflow-y-auto p-1.5 translate-y-0 animate-in fade-in slide-in-from-top-2 duration-300">
          {totalResults === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-base font-black text-gray-900">"{query}" is not available</p>
              <p className="text-xs text-gray-400 mt-2 max-w-[200px] mx-auto leading-relaxed text-center">
                This product is not currently listed in any Butuan City market hub.
              </p>
            </div>
          ) : (
            <>
              <div className="px-4 py-2 mb-1">
                 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 text-left">Database Results ({totalResults})</p>
              </div>
              {filteredCategories.map((cat) => (
                <div key={cat} className="mb-2 last:mb-0">
                  <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#1d631d] bg-green-50/50 rounded-lg mb-1 text-left">
                    {cat}
                  </div>
                  {filteredGroups[cat].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelect(p.id)}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-xl transition-all flex items-center gap-3 ${
                        p.id === selectedProductId
                          ? 'bg-green-50 text-green-800 font-black'
                          : 'text-gray-700 font-semibold'
                      }`}
                    >
                      <span className="flex-1">{p.name}</span>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-tighter">
                        {p.unit}
                      </span>
                      {p.id === selectedProductId && (
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </>
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
 
  /* ---- Fetch listings when product changes ---- */
  const fetchListings = useCallback(async (productId: string) => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('price_listings')
      .select(`
        id, price, is_available, last_updated, vendor_id, market_id, product_id,
        products ( id, name, unit, image_url ),
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
    router.push(`/compare?product=${productId}`, { scroll: false } as any)
  }
 
  function handleClearProduct() {
    setSelectedProductId(null)
    setListings([])
    setActiveMarketFilter('all')
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
      return true
    })
  }, [listings, activeMarketFilter])
 
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
    <div className="min-h-screen bg-white dark:bg-[#050a05] pb-20 md:pb-8 transition-colors duration-500">
      {/* ============================================================ */}
      {/* Hero Header                                                    */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-[#050a05] transition-colors duration-500">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-6 italic font-serif">
            Compare Prices <span className="font-serif italic font-medium text-[#1b6b3e] dark:text-green-500">Across Markets</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium max-w-2xl leading-relaxed">
            Access verified agricultural data from city bureaus. Select your products and<br className="hidden md:block" />
            compare live pricing from all official municipal market hubs.
          </p>
        </div>
 
        {/* New Search Controls Bar */}
        <div className="max-w-6xl mx-auto px-6 pb-16">
          <div className="bg-white dark:bg-[#0a0f0a] rounded-[2rem] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-white/5 transition-colors">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-end gap-8">
              
              {/* Product Search */}
              <div className="lg:col-span-5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">
                  Search Product
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
              <div className="lg:col-span-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">
                  Select Region
                </label>
                <div className="relative group">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1b6b3e]/60 z-10" />
                  <Select value={activeMarketFilter} onValueChange={setActiveMarketFilter}>
                    <SelectTrigger className="h-14 pl-12 pr-6 rounded-xl border-none bg-gray-100 dark:bg-white/5 font-bold text-sm text-gray-900 dark:text-white group-hover:bg-gray-200/50 transition-colors shadow-inner">
                      <SelectValue placeholder="All Markets" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                      <SelectItem value="all" className="rounded-lg font-bold">All Markets</SelectItem>
                      {allMarkets.map((m) => (
                        <SelectItem key={m} value={m} className="rounded-lg font-medium">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
 
              {/* Compare Button */}
              <div className="lg:col-span-3">
                <Button
                  className="w-full h-14 rounded-2xl bg-[#007e41] hover:bg-[#006b37] text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-green-900/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                  onClick={() => {
                    if (selectedProductId) fetchListings(selectedProductId)
                  }}
                >
                  <span>Compare</span>
                  <TrendingUp className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* ============================================================ */}
      {/* Main Content Area                                             */}
      {/* ============================================================ */}
      <div className="max-w-6xl mx-auto px-6 py-4">
 
        {/* ============================================================ */}
        {/* Empty State — No product selected                            */}
        {/* ============================================================ */}
        {!selectedProductId && !loading && (
          <div className="rounded-[3rem] bg-gradient-to-br from-gray-50 to-white dark:from-[#081008] dark:to-[#050a05] border border-gray-100 dark:border-white/5 py-32 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden transition-colors duration-500">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1b6b3e 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            
            <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mb-10 relative z-10 animate-bounce-slow">
               <div className="relative">
                  <Search className="w-10 h-10 text-gray-200" />
                  <LineChart className="w-6 h-6 text-[#1b6b3e] absolute -bottom-1 -right-1" />
               </div>
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tight relative z-10 font-serif italic">
              Search for a product to compare prices
            </h2>
            <p className="text-gray-400 max-w-md mx-auto text-sm font-medium leading-relaxed mb-12 relative z-10">
              Enter the name of an item above to see a breakdown of pricing trends and availability across the city's verified agricultural hubs.
            </p>
 
            <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
               {['RICE', 'BEEF', 'YELLOW CORN', 'ORGANIC EGGS'].map(tag => (
                 <button 
                  key={tag}
                  onClick={() => {
                    const match = initialProducts.find(p => p.name.toUpperCase().includes(tag))
                    if (match) handleProductSelect(match.id)
                  }}
                  className="px-6 py-2 rounded-full bg-white border border-gray-200 text-[10px] font-black text-gray-400 hover:border-[#1b6b3e] hover:text-[#1b6b3e] transition-all uppercase tracking-[0.15em] shadow-sm"
                 >
                   {tag}
                 </button>
               ))}
            </div>
          </div>
        )}
 
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#1b6b3e] animate-spin mb-6" />
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Analyzing market hub data…</p>
          </div>
        )}
 
        {/* No listings found */}
        {selectedProductId && !loading && listings.length === 0 && (
          <div className="rounded-[3rem] bg-gray-50 border border-gray-100 py-32 flex flex-col items-center justify-center text-center px-4">
            <PackageOpen className="w-16 h-16 text-gray-200 mb-8" />
            <h2 className="text-xl font-black text-gray-900 mb-2">
              No listings currently available
            </h2>
            <p className="text-gray-400 max-w-sm mx-auto text-sm font-medium leading-relaxed mb-10">
              None of the official market hubs are currently reporting live supply for this product.
            </p>
            <Button
              variant="outline"
              className="h-12 px-8 rounded-2xl border-gray-200 bg-white font-black text-xs uppercase tracking-widest text-gray-500 hover:text-[#1b6b3e] hover:border-[#1b6b3e] transition-all"
              onClick={handleClearProduct}
            >
              Back to comparison
            </Button>
          </div>
        )}
 
        {/* ============================================================ */}
        {/* Results                                                       */}
        {/* ============================================================ */}
        {selectedProductId && !loading && listings.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Summary strip */}
            {stats && (
              <div className="flex flex-wrap items-center gap-x-12 gap-y-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-12 pb-6 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Verified Listings:</span>
                  <span className="text-gray-900 dark:text-white tracking-normal">{stats.totalListings} Units</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Market Hubs:</span>
                  <span className="text-gray-900 dark:text-white tracking-normal">{stats.uniqueMarkets} Hubs</span>
                </div>
                <div className="flex items-center gap-3 lg:ml-auto">
                  <span className="w-2 h-2 rounded-full bg-green-600" />
                  <span>Global Min Price:</span>
                  <Badge className="bg-[#1b6b3e] dark:bg-green-600 text-white font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest">
                    {formatPeso(stats.lowestPrice)}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700" />
                  <span>Global Max Price:</span>
                  <span className="text-gray-900 dark:text-white tracking-normal">{formatPeso(stats.highestPrice)}</span>
                </div>
              </div>
            )}
 
            {/* Filtered empty */}
            {filteredListings.length === 0 && (
              <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-gray-100">
                <PackageOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No matching listings found.</p>
                <Button
                  variant="ghost"
                  className="mt-6 text-[#1b6b3e] text-xs font-black uppercase tracking-widest hover:bg-[#1b6b3e]/5 h-10 px-6 rounded-xl"
                  onClick={() => { setActiveMarketFilter('all') }}
                >
                  Reset all filters
                </Button>
              </div>
            )}
 
            {/* Cards */}
            {filteredListings.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                {filteredListings.map((listing) => {
                  const isBest = listing.price === lowestPrice
                  return (
                    <div
                      key={listing.id}
                      className={cn(
                        "group relative bg-white dark:bg-[#0a0f0a] rounded-[2.5rem] overflow-hidden transition-all duration-500 border border-gray-100 dark:border-white/5 hover:shadow-2xl dark:hover:shadow-[0_0_40px_-10px_rgba(27,107,62,0.3)] hover:-translate-y-1",
                        isBest && "ring-2 ring-[#007e41] shadow-xl shadow-[#007e41]/5 dark:shadow-[0_0_40px_-5px_rgba(34,197,94,0.1)]"
                      )}
                    >
                      <div className="p-8">
                        {/* Market name + price */}
                        <div className="flex items-start justify-between mb-8">
                          <div className="text-left">
                            <div className="flex items-center gap-2 mb-1">
                               <Store className="w-4 h-4 text-[#1b6b3e]" />
                               <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.1em]">
                                 {listing.markets?.name ?? '—'}
                               </h3>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5 ml-6">
                              <MapPin className="w-3 h-3" />
                               {listing.markets?.barangay ?? 'Butuan District'}
                            </p>
                          </div>
                          <div className="text-right">
                            {isBest && (
                              <div className="inline-flex items-center gap-1 bg-[#1b6b3e] text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest mb-2 shadow-lg shadow-[#1b6b3e]/20">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Best Deal
                              </div>
                            )}
                            <p className={cn(
                              "text-4xl font-black tracking-tight",
                              isBest ? 'text-[#007e41] dark:text-green-500' : 'text-gray-900 dark:text-white'
                            )}>
                              {formatPeso(listing.price)}
                            </p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">
                              PER {listing.products?.unit ?? 'UNIT'}
                            </p>
                          </div>
                        </div>
 
                        {/* Vendor info */}
                        <div className="bg-gray-50 dark:bg-black/40 rounded-2xl p-5 flex items-center justify-between mb-8">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                                 <LayoutDashboard className="w-5 h-5 text-[#1b6b3e]/60" />
                              </div>
                              <div className="text-left">
                                 <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wide">
                                   {listing.vendors?.business_name ?? '—'}
                                 </p>
                                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                   STALL {listing.vendors?.stall_number ?? '—'}
                                 </p>
                              </div>
                           </div>
                           <Badge variant="outline" className="bg-white border-gray-200 text-[#1b6b3e] font-black text-[9px] uppercase tracking-widest py-1 px-3 rounded-full">
                              Verified
                           </Badge>
                        </div>
 
                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            asChild
                            className="h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-sm"
                          >
                            <Link href={`/markets/${listing.market_id}`}>
                               Hub Details
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
                            productImage={listing.products?.image_url}
                            triggerLabel="Ask Vendor"
                            triggerVariant="solid" 
                            triggerSize="lg"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
 
            {/* Price Trend Chart Container */}
            <div className="rounded-[3rem] bg-gray-900 p-10 md:p-16 mb-20 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 blur-[100px] pointer-events-none group-hover:bg-green-500/20 transition-all duration-1000" />
               <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-10 text-left">
                     <div className="p-3 bg-green-500/10 rounded-2xl">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">Market Price Analytics</h3>
                        <p className="text-gray-400 text-sm font-medium mt-1">Visualizing 30-day historical data and price trends.</p>
                     </div>
                  </div>
                  {selectedProductId && (
                    <PriceTrendChart productId={selectedProductId} />
                  )}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

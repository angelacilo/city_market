'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ComparisonListing, ProductWithCategory } from '@/lib/queries/compare'
import InquiryTrigger from '@/components/public/InquiryTrigger'
import PriceTrendChart from '@/components/compare/PriceTrendChart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'

import {
  Loader2,
  BarChart2,
  PackageOpen,
  TrendingDown,
  TrendingUp,
  Store,
  List,
  Table2,
  LayoutGrid,
  Sparkles,
  DoorOpen,
  CheckCircle2,
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

type ViewMode = 'table' | 'card'

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
  const [activeAvailability, setActiveAvailability] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('table')

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
    // Skip initial fetch if we already have initial listings for this product
    if (initialListings.length > 0 && selectedProductId === initialProductId) {
      return
    }
    fetchListings(selectedProductId)
  }, [selectedProductId]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Handle product selection ---- */
  function handleProductSelect(productId: string) {
    setSelectedProductId(productId)
    setActiveMarketFilter('all')
    setActiveAvailability('all')
    router.push(`/compare?product=${productId}`, { scroll: false } as any)
  }

  function handleClearProduct() {
    setSelectedProductId(null)
    setListings([])
    setActiveMarketFilter('all')
    setActiveAvailability('all')
    router.push('/compare', { scroll: false } as any)
  }

  /* ---- Derive unique markets from listings ---- */
  const uniqueMarkets = useMemo(() => {
    const names = new Set(listings.map((l) => l.markets?.name).filter(Boolean) as string[])
    return Array.from(names).sort()
  }, [listings])

  /* ---- Filtered listings ---- */
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      if (activeMarketFilter !== 'all' && l.markets?.name !== activeMarketFilter) return false
      if (activeAvailability === 'available' && !l.is_available) return false
      return true
    })
  }, [listings, activeMarketFilter, activeAvailability])

  /* ---- Compute summary stats from filtered listings ---- */
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

  /* ---- Identify best / worst rows ---- */
  const lowestPrice = stats?.lowestPrice ?? null
  const highestPrice = stats?.highestPrice ?? null

  /* ---- Product groups ---- */
  const productGroups = useMemo(() => groupByCategory(initialProducts), [initialProducts])
  const sortedCategories = Object.keys(productGroups).sort()

  /* ---- Popular quick-select products ---- */
  const quickSelectNames = ['Rice', 'Pork', 'Chicken', 'Bangus', 'Tilapia', 'Onion', 'Garlic', 'Eggs']

  function handleQuickSelect(name: string) {
    const found = initialProducts.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    )
    if (found) handleProductSelect(found.id)
  }

  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* ============================================================ */}
      {/* Zone 1: Product Selector Panel                               */}
      {/* ============================================================ */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Label */}
            <div className="flex-shrink-0">
              <p className="text-sm font-black text-gray-900 uppercase tracking-widest">
                Select a product to compare
              </p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                See prices from all vendors across every Butuan market.
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:justify-end">
              {/* Product selector */}
              <div className="relative flex items-center gap-2 flex-1 sm:max-w-xs">
                <Select
                  value={selectedProductId ?? ''}
                  onValueChange={handleProductSelect}
                >
                  <SelectTrigger
                    id="product-selector"
                    className="h-11 flex-1 font-semibold border-gray-200 focus:ring-green-500 min-w-0"
                  >
                    <SelectValue placeholder="Choose a product..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {sortedCategories.map((cat) => (
                      <div key={cat}>
                        <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 sticky top-0">
                          {cat}
                        </div>
                        {productGroups[cat].map((p) => (
                          <SelectItem key={p.id} value={p.id} className="pl-5">
                            {p.name}{' '}
                            <span className="text-gray-400 text-xs">({p.unit})</span>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                {loading && (
                  <Loader2 className="w-4 h-4 text-green-600 animate-spin flex-shrink-0" />
                )}
              </div>

              {/* Market filter */}
              <Select
                value={activeMarketFilter}
                onValueChange={setActiveMarketFilter}
              >
                <SelectTrigger
                  id="market-filter"
                  className="h-11 min-w-[160px] font-semibold border-gray-200 focus:ring-green-500"
                >
                  <Store className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                  <SelectValue placeholder="All markets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All markets</SelectItem>
                  {uniqueMarkets.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Availability pills */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveAvailability('available')}
                  className={`h-11 px-4 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                    activeAvailability === 'available'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-700'
                  }`}
                >
                  In stock only
                </button>
                <button
                  onClick={() => setActiveAvailability('all')}
                  className={`h-11 px-4 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                    activeAvailability === 'all'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-700'
                  }`}
                >
                  Show all
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Main Content Area                                             */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ============================================================ */}
        {/* Empty State — No product selected                            */}
        {/* ============================================================ */}
        {!selectedProductId && !loading && (
          <div className="flex flex-col items-center justify-center text-center py-20 px-4">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-green-200">
              <BarChart2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-tight">
              Compare prices across Butuan markets
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto font-medium leading-relaxed mb-6 text-sm">
              Select any product from the dropdown above to instantly see which market offers the
              best price today. All prices are updated by vendors in real time so you always see
              accurate information before you go shopping.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {['Live vendor prices', 'All 6 Butuan markets', 'Free to use'].map((feat) => (
                <Badge
                  key={feat}
                  variant="outline"
                  className="text-green-700 border-green-300 font-bold px-3 py-1"
                >
                  {feat}
                </Badge>
              ))}
            </div>

            {/* Quick-select buttons */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {quickSelectNames.map((name) => (
                <Button
                  key={name}
                  variant="outline"
                  className="h-11 px-5 text-sm font-bold hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-all"
                  onClick={() => handleQuickSelect(name)}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* Loading skeleton while fetching                               */}
        {/* ============================================================ */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-20 bg-green-50 rounded-2xl border border-green-100" />
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
                  <div className="h-4 bg-gray-100 rounded w-6" />
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-4 bg-gray-100 rounded w-28" />
                  <div className="h-4 bg-gray-100 rounded w-16" />
                  <div className="h-4 bg-gray-100 rounded w-16 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* Results: has product but zero listings                        */}
        {/* ============================================================ */}
        {selectedProductId && !loading && listings.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <PackageOpen className="w-16 h-16 text-gray-300 mb-6" />
            <h2 className="text-xl font-black text-gray-900 mb-3 uppercase tracking-tight">
              No listings found for this product
            </h2>
            <p className="text-gray-400 max-w-md mx-auto text-sm font-medium leading-relaxed mb-8">
              None of the vendors in Butuan City markets are currently listing this product. Try
              selecting a different product or check back later as vendors update their listings
              regularly.
            </p>
            <Button
              variant="outline"
              className="h-11 px-6 font-black uppercase text-xs tracking-widest border-gray-200 hover:border-green-300 hover:text-green-700 transition-all"
              onClick={handleClearProduct}
            >
              Clear selection
            </Button>
          </div>
        )}

        {/* ============================================================ */}
        {/* Results: has listings                                          */}
        {/* ============================================================ */}
        {selectedProductId && !loading && listings.length > 0 && (
          <>
            {/* ========================================================= */}
            {/* Zone 2: Summary strip                                       */}
            {/* ========================================================= */}
            {stats && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-6">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {/* Chip: total listings */}
                  <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-green-100 shadow-sm">
                    <List className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-black text-gray-700">
                      {stats.totalListings} listing{stats.totalListings !== 1 && 's'}
                    </span>
                  </div>

                  {/* Chip: markets */}
                  <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-green-100 shadow-sm">
                    <Store className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-black text-gray-700">
                      {stats.uniqueMarkets} market{stats.uniqueMarkets !== 1 && 's'}
                    </span>
                  </div>

                  {/* Chip: best price */}
                  <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-green-100 shadow-sm">
                    <TrendingDown className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs font-black text-green-700">
                      Best price: {formatPeso(stats.lowestPrice)}
                    </span>
                  </div>

                  {/* Chip: most expensive */}
                  <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-green-100 shadow-sm">
                    <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs font-black text-red-600">
                      Most expensive: {formatPeso(stats.highestPrice)}
                    </span>
                  </div>

                  {/* View toggle */}
                  <div className="flex items-center gap-1 ml-auto bg-white rounded-xl border border-green-100 p-1 shadow-sm">
                    <button
                      onClick={() => setViewMode('table')}
                      aria-label="Table view"
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                        viewMode === 'table'
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-green-600'
                      }`}
                    >
                      <Table2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('card')}
                      aria-label="Card view"
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                        viewMode === 'card'
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-green-600'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Filtered empty state */}
            {filteredListings.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <PackageOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-500">
                  No listings match your filters.
                </p>
                <Button
                  variant="ghost"
                  className="mt-3 text-green-600 text-xs font-black uppercase tracking-widest h-9"
                  onClick={() => {
                    setActiveMarketFilter('all')
                    setActiveAvailability('all')
                  }}
                >
                  Reset filters
                </Button>
              </div>
            )}

            {/* ========================================================= */}
            {/* Zone 3a: Table view                                         */}
            {/* ========================================================= */}
            {viewMode === 'table' && filteredListings.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="w-12 font-black text-gray-500 text-xs uppercase tracking-widest">
                          #
                        </TableHead>
                        <TableHead className="hidden md:table-cell font-black text-gray-500 text-xs uppercase tracking-widest">
                          Market
                        </TableHead>
                        <TableHead className="hidden md:table-cell font-black text-gray-500 text-xs uppercase tracking-widest">
                          Vendor
                        </TableHead>
                        <TableHead className="font-black text-gray-500 text-xs uppercase tracking-widest">
                          Price
                        </TableHead>
                        <TableHead className="font-black text-gray-500 text-xs uppercase tracking-widest">
                          Stock
                        </TableHead>
                        <TableHead className="font-black text-gray-500 text-xs uppercase tracking-widest text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredListings.map((listing, idx) => {
                        const isBest = listing.price === lowestPrice
                        const isWorst = listing.price === highestPrice && filteredListings.length > 1

                        return (
                          <TableRow
                            key={listing.id}
                            className={
                              isBest
                                ? 'bg-green-50/60 hover:bg-green-50'
                                : isWorst
                                ? 'bg-red-50/40 hover:bg-red-50/60'
                                : 'hover:bg-gray-50'
                            }
                          >
                            {/* Rank */}
                            <TableCell className="font-black text-gray-400 text-sm w-12">
                              {idx + 1}
                            </TableCell>

                            {/* Market — desktop only */}
                            <TableCell className="hidden md:table-cell">
                              <p className="font-bold text-sm text-gray-900">
                                {listing.markets?.name ?? '—'}
                              </p>
                              <p className="text-xs text-gray-400 font-medium">
                                {listing.markets?.barangay ?? ''}
                              </p>
                            </TableCell>

                            {/* Vendor — desktop only */}
                            <TableCell className="hidden md:table-cell">
                              <p className="font-bold text-sm text-gray-900">
                                {listing.vendors?.business_name ?? '—'}
                              </p>
                              <p className="text-xs text-gray-400 font-medium">
                                {listing.vendors?.stall_number
                                  ? `Stall ${listing.vendors.stall_number}`
                                  : ''}
                              </p>
                            </TableCell>

                            {/* Price (mobile includes market+vendor info) */}
                            <TableCell>
                              <p className="text-lg font-black text-gray-900">
                                {formatPeso(listing.price)}
                              </p>
                              <p className="text-xs text-gray-400 font-medium">
                                per {listing.products?.unit ?? 'unit'}
                              </p>
                              {/* Mobile-only location info */}
                              <div className="md:hidden mt-1">
                                <p className="text-xs font-bold text-gray-700">
                                  {listing.markets?.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {listing.vendors?.business_name}
                                  {listing.vendors?.stall_number
                                    ? ` · Stall ${listing.vendors.stall_number}`
                                    : ''}
                                </p>
                              </div>
                              {/* Badges */}
                              <div className="mt-1 flex flex-wrap gap-1">
                                {isBest && (
                                  <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 font-black uppercase tracking-wide flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    Best deal
                                  </Badge>
                                )}
                                {isWorst && (
                                  <Badge
                                    variant="outline"
                                    className="text-red-500 border-red-300 text-[10px] px-1.5 py-0.5 font-black uppercase tracking-wide"
                                  >
                                    Most expensive
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            {/* Availability */}
                            <TableCell>
                              {listing.is_available ? (
                                <Badge className="bg-green-600 text-white font-bold text-[10px] uppercase tracking-wide">
                                  In stock
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-red-500 border-red-300 font-bold text-[10px] uppercase tracking-wide"
                                >
                                  Out of stock
                                </Badge>
                              )}
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  asChild
                                  size="sm"
                                  className="h-11 bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
                                >
                                  <Link href={`/markets/${listing.market_id}`}>
                                    Go to market
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
                                  triggerLabel="Ask vendor"
                                  triggerVariant="outline"
                                  triggerSize="sm"
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* Zone 3b: Card grid view                                     */}
            {/* ========================================================= */}
            {viewMode === 'card' && filteredListings.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings.map((listing) => {
                  const isBest = listing.price === lowestPrice
                  const isWorst = listing.price === highestPrice && filteredListings.length > 1

                  return (
                    <div
                      key={listing.id}
                      className={`relative bg-white rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${
                        isBest
                          ? 'border-2 border-green-500'
                          : isWorst
                          ? 'border border-red-300'
                          : 'border border-gray-100'
                      }`}
                    >
                      {/* Best deal ribbon */}
                      {isBest && (
                        <div
                          className="absolute top-3 right-[-22px] rotate-45 bg-green-600 text-white text-[9px] font-black uppercase tracking-widest px-8 py-0.5 z-10 shadow"
                        >
                          Best
                        </div>
                      )}

                      <div className="p-5">
                        {/* Market */}
                        <div className="mb-3">
                          <p className="font-black text-sm text-gray-900 uppercase tracking-tight">
                            {listing.markets?.name ?? '—'}
                          </p>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">
                            {listing.markets?.barangay ?? ''}
                          </p>
                        </div>

                        {/* Price — hero element */}
                        <p className={`text-3xl font-extrabold ${isBest ? 'text-green-700' : 'text-gray-900'}`}>
                          {formatPeso(listing.price)}
                        </p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5 mb-4">
                          per {listing.products?.unit ?? 'unit'}
                        </p>

                        {/* Badges for best / worst */}
                        <div className="flex gap-1 mb-4">
                          {isBest && (
                            <Badge className="bg-green-600 text-white text-[10px] px-2 py-0.5 font-black uppercase tracking-wide flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              Best deal
                            </Badge>
                          )}
                          {isWorst && (
                            <Badge
                              variant="outline"
                              className="text-red-500 border-red-300 text-[10px] px-2 py-0.5 font-black uppercase tracking-wide"
                            >
                              Most expensive
                            </Badge>
                          )}
                        </div>

                        {/* Vendor info */}
                        <p className="font-bold text-sm text-gray-800">
                          {listing.vendors?.business_name ?? '—'}
                        </p>
                        {listing.vendors?.stall_number && (
                          <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5 mb-3">
                            <DoorOpen className="w-3 h-3" />
                            Stall {listing.vendors.stall_number}
                          </p>
                        )}

                        {/* Availability */}
                        {listing.is_available ? (
                          <Badge className="bg-green-600 text-white font-bold text-[10px] uppercase tracking-wide flex items-center gap-1 w-fit mb-4">
                            <CheckCircle2 className="w-3 h-3" />
                            In stock
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-red-500 border-red-300 font-bold text-[10px] uppercase tracking-wide w-fit mb-4"
                          >
                            Out of stock
                          </Badge>
                        )}

                        <Separator className="mb-4" />

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            asChild
                            size="sm"
                            className="h-11 flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
                          >
                            <Link href={`/markets/${listing.market_id}`}>
                              Go to market
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
                            triggerLabel="Ask vendor"
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

            {/* ========================================================= */}
            {/* Zone 4: Price Trend Chart                                   */}
            {/* ========================================================= */}
            {selectedProductId && (
              <PriceTrendChart productId={selectedProductId} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

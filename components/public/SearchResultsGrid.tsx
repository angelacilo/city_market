'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Store, DoorClosed, Star, Sparkles, TrendingUp, Info, ShoppingBasket, Check } from 'lucide-react'
import InquiryTrigger from './InquiryTrigger'
import { addToCanvass } from '@/lib/actions/canvass'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { SearchListing } from './SearchResultsWrapper'
import Link from 'next/link'

interface SearchResultsGridProps {
  listings: SearchListing[]
  lowestPrice: number
  highestPrice: number
  currentLowestPrice: number
  currentMarketsCount: number
  currentBestMarket: string
  onClearFilters: () => void
}

export default function SearchResultsGrid({
  listings,
  lowestPrice,
  highestPrice,
  currentLowestPrice,
  currentMarketsCount,
  currentBestMarket,
  onClearFilters,
}: SearchResultsGridProps) {
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null)
  const supabase = createClient()

  const handleAddToCanvass = async (listing: any) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setToast({ message: 'Please login to use canvass', type: 'info' })
      setTimeout(() => setToast(null), 2000)
      return
    }

    const productId = listing.product_id || listing.id
    const res = await addToCanvass(productId, session.user.id)
    if (res.status === 'success') {
      setToast({ message: 'Added to canvass list', type: 'success' })
    } else if (res.status === 'already_exists') {
      setToast({ message: 'Already in your canvass', type: 'info' })
    }
    setTimeout(() => setToast(null), 2000)
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 my-12 bg-white dark:bg-[#0a0f0a] rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/5 transition-colors duration-500">
        <div className="w-16 h-16 bg-orange-50 dark:bg-orange-500/10 rounded-full flex items-center justify-center">
          <Info className="w-8 h-8 text-orange-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight italic font-serif">No matches</h3>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest leading-relaxed max-w-sm">
            No results match your current filters. Try clearing the market filter or showing all availability.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="mt-4 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-900 font-black uppercase tracking-widest text-[10px] h-12"
        >
          Clear filters
        </Button>
      </div>
    )
  }

  const grouped = listings.reduce((acc, listing) => {
    const marketName = listing.markets?.name || 'Unknown Market'
    if (!acc[marketName]) acc[marketName] = []
    acc[marketName].push(listing)
    return acc
  }, {} as Record<string, SearchListing[]>)

  const marketKeys = Object.keys(grouped).sort()

  return (
    <div className="space-y-12">
      {/* Summary Strip */}
      <div className="w-full bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-3xl p-4 sm:p-6 shadow-sm shadow-green-100/50 dark:shadow-none flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 transition-colors">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-green-100 shadow-sm w-max">
              Total found
            </span>
            <span className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              {listings.length} listings
            </span>
          </div>
          <div className="w-px h-8 bg-green-200 hidden sm:block" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-green-100 shadow-sm w-max">
              Availability
            </span>
            <span className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              {currentMarketsCount} markets
            </span>
          </div>
        </div>

        <div className="w-full lg:w-px h-px lg:h-8 bg-green-200" />

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col lg:items-end gap-1">
            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-green-100 shadow-sm w-max">
              Cheapest Price
            </span>
            <span className="text-xl font-black text-green-700 uppercase tracking-tighter flex items-center gap-2">
              From &#8369;{currentLowestPrice.toFixed(2)}
              <Sparkles className="w-4 h-4 text-green-500" />
            </span>
          </div>
          <div className="w-px h-8 bg-green-200 hidden sm:block" />
          <div className="flex flex-col lg:items-end gap-1">
            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-green-100 shadow-sm w-max">
              Best Market
            </span>
            <span className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              Best at {currentBestMarket}
            </span>
          </div>
        </div>
      </div>

      {/* Grouped Markets Grid */}
      <div className="space-y-16">
        {marketKeys.map((marketName) => {
          const marketListings = grouped[marketName]
          const firstListing = marketListings[0]
          const barangay = firstListing?.markets?.barangay || 'Butuan City'

          return (
            <div key={marketName} className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                  {marketName}
                </h2>
                <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full font-bold px-3 py-1 text-xs outline-none border-none">
                  {marketListings.length}
                </Badge>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-widest ml-auto bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                  <MapPin className="w-3 h-3 text-green-500" />
                  {barangay}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {marketListings.map((listing) => {
                  const isLowest = listing.price === lowestPrice
                  const isHighest = listing.price === highestPrice

                  return (
                    <Card key={listing.id} className="group overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:border-green-400 dark:hover:border-green-600 transition-all duration-500 rounded-3xl bg-white dark:bg-[#0a0f0a] p-6 sm:p-8 flex flex-col gap-6 scale-100 hover:-translate-y-1">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none group-hover:text-green-600 dark:group-hover:text-green-500 transition-colors font-serif italic">
                            {listing.products?.name}
                          </h3>
                          <Badge variant="outline" className="text-gray-400 dark:text-gray-500 font-bold text-[9px] uppercase tracking-widest border-gray-200 dark:border-white/5 p-1.5 px-3 rounded-lg bg-gray-50 dark:bg-white/5">
                            {listing.products?.categories?.name || 'General Supply'}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-8 pb-10 rounded-[2rem] bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center gap-2 group-hover:bg-green-50/50 dark:group-hover:bg-green-500/5 group-hover:border-green-100 dark:group-hover:border-green-800/30 transition-colors relative shadow-inner">
                        {isLowest && (
                          <Badge className="absolute -top-3 bg-green-600 hover:bg-green-700 text-white font-black text-[9px] uppercase tracking-widest py-1.5 px-3 rounded-xl shadow-lg shadow-green-200 border-none flex items-center gap-1.5 z-10">
                            <Star className="w-3 h-3 fill-current" />
                            Best deal
                          </Badge>
                        )}
                        {isHighest && (
                          <Badge variant="outline" className="absolute -top-3 bg-white text-red-500 border-red-200 font-black text-[9px] uppercase tracking-widest py-1.5 px-3 rounded-xl flex items-center gap-1.5 z-10 shadow-sm">
                            <TrendingUp className="w-3 h-3" />
                            Most Expensive
                          </Badge>
                        )}
                        <div className="text-4xl sm:text-5xl font-black text-green-700 dark:text-green-500 tracking-tighter">
                          &#8369;{listing.price.toLocaleString()}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                          Per {listing.products?.unit || 'unit'}
                        </span>
                      </div>

                      <div className="space-y-3 px-2">
                        <div className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/5">
                          {listing.vendors?.business_name || 'Market Vendor'}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                            <Store className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" />
                            {marketName}
                          </div>
                          <div className="hidden sm:block w-px h-3 bg-gray-200 dark:bg-white/5 self-center" />
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                            <DoorClosed className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" />
                            Stall {listing.vendors?.stall_number || 'TBA'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-[1fr,1fr,48px] gap-3 mt-2 sm:mt-auto pt-4 border-t border-gray-50">
                        <Link href={`/compare?product=${listing.id}`}>
                          <Button className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-green-100 dark:shadow-none px-1">
                            Compare
                          </Button>
                        </Link>

                        <InquiryTrigger
                          vendorId={listing.vendor_id}
                          listingId={listing.id}
                          productName={listing.products?.name ?? ''}
                          vendorName={listing.vendors?.business_name ?? ''}
                          marketName={listing.markets?.name ?? ''}
                          price={listing.price}
                          unit={listing.products?.unit ?? 'unit'}
                          productImage={listing.products?.image_url}
                          triggerLabel="Ask vendor"
                          triggerVariant="outline"
                          triggerSize="default"
                        />

                        <button
                          onClick={() => handleAddToCanvass(listing)}
                          className="w-12 h-12 rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-green-700 dark:hover:text-green-500 hover:bg-green-50 dark:hover:bg-white/10 transition-all shadow-sm shrink-0"
                          title="Add to canvass list"
                        >
                          <ShoppingBasket className="w-5 h-5" />
                        </button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={cn(
            "px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md border",
            toast.type === 'success' ? "bg-green-900 border-green-800 text-white" : "bg-gray-900 border-gray-800 text-white"
          )}>
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center",
              toast.type === 'success' ? "bg-green-700" : "bg-gray-700"
            )}>
              {toast.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
            </div>
            <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}

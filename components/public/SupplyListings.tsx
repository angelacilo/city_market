'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingBag, 
  Store, 
  Search, 
  Filter, 
  ShoppingBasket, 
  Check, 
  Info, 
  Loader2,
  MessageCircle,
  Plus
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import InquiryTrigger from './InquiryTrigger'
import { addToCanvass } from '@/lib/actions/canvass'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Listing {
  id: string
  price: number
  is_available: boolean
  stock_quantity?: number
  product_id?: string
  vendor_id: string
  products: {
    name: string
    unit: string
    image_url?: string | null
    categories: {
      name: string
    } | null | any
  } | null | any
  vendors: {
    id?: string
    business_name: string
    stall_number: string | null
    contact_number: string | null
  } | null | any
}

interface SupplyListingsProps {
  marketId: string
  marketName?: string
  vendorId?: string
}

export default function SupplyListings({ marketId, marketName = '', vendorId }: SupplyListingsProps) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [addingProduct, setAddingProduct] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null)
  const supabase = createClient()

  const fetchListings = useCallback(async () => {
    const query = supabase
      .from('price_listings')
      .select(`
        id, 
        price, 
        is_available, 
        vendor_id,
        product_id,
        products (
          name, 
          unit,
          image_url,
          categories ( name )
        ),
        vendors (
          id,
          business_name,
          stall_number,
          contact_number
        )
      `)
      .eq('market_id', marketId)
      .eq('is_available', true)
    
    if (vendorId) {
      query.eq('vendor_id', vendorId)
    }

    const { data } = await query
    if (data) {
      setListings(data as any)
    }
    setLoading(false)
  }, [marketId, vendorId, supabase])

  useEffect(() => {
    fetchListings()

    const channel = supabase
      .channel(`market-listings-${marketId}`)
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'price_listings',
        filter: vendorId ? `vendor_id=eq.${vendorId}` : `market_id=eq.${marketId}`
      }, () => {
        fetchListings()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [marketId, fetchListings, supabase])

  const categories = useMemo(() => {
    const cats = new Set<string>()
    cats.add('All')
    listings.forEach((listing) => {
      const catName = listing.products?.categories?.name
      if (catName) cats.add(catName)
    })
    return Array.from(cats)
  }, [listings])

  const filteredListings = useMemo(() => {
    const term = search.toLowerCase().trim()
    return listings.filter((listing) => {
      const matchCat = activeCategory === 'All' || listing.products?.categories?.name === activeCategory
      const matchSearch = !term || (listing.products?.name || '').toLowerCase().includes(term)
      return matchCat && matchSearch
    })
  }, [listings, activeCategory, search])

  const handleAddToCanvass = async (productId: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setToast({ message: 'Please login to use canvass', type: 'info' })
      setTimeout(() => setToast(null), 2000)
      return
    }

    setAddingProduct(productId)
    const res = await addToCanvass(productId, session.user.id)
    setAddingProduct(null)

    if (res.status === 'success') {
      setToast({ message: 'Added to canvass list', type: 'success' })
      window.dispatchEvent(new CustomEvent('open-canvass'))
    } else if (res.status === 'already_exists') {
      window.dispatchEvent(new CustomEvent('open-canvass'))
      setToast({ message: 'Already in your canvass', type: 'info' })
    }
    setTimeout(() => setToast(null), 2000)
  }

  if (loading && listings.length === 0) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-10 h-10 text-green-700 dark:text-green-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-12 dark:bg-[#0a140a] transition-colors duration-500 pb-20">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 py-8 px-4 sm:px-0">
        <div>
          <h2 className="text-4xl lg:text-5xl font-serif font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Available <span className="text-green-700 italic dark:text-green-500">Supplies</span>
          </h2>
          <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
            Real-time market monitoring active
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-[320px] group">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
             <input 
               type="text"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder={`Search products in ${marketName}...`}
               className="w-full h-14 pl-12 pr-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/20 focus:border-green-700 dark:focus:border-green-500 text-sm font-bold dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 transition-all outline-none"
             />
          </div>

          <Select value={activeCategory} onValueChange={setActiveCategory}>
            <SelectTrigger className="h-14 w-full sm:w-44 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm font-black text-[10px] uppercase tracking-widest px-8 focus:ring-green-700 dark:text-white">
               <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-gray-100 dark:border-white/10 shadow-2xl p-2 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md">
              {categories.map((cat) => (
                <SelectItem 
                  key={cat} 
                  value={cat}
                  className="rounded-xl font-bold text-[10px] uppercase tracking-widest py-3 focus:bg-green-50 dark:focus:bg-green-900/20 focus:text-green-700 dark:focus:text-green-400 cursor-pointer dark:text-gray-300"
                >
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 sm:px-0">
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {filteredListings.map((listing) => (
              <Card
                key={listing.id}
                className="group overflow-hidden border-none shadow-[0_10px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.5)] hover:shadow-[0_30px_100px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_40px_150px_rgba(0,0,0,0.8)] transition-all duration-700 rounded-[2.5rem] bg-white dark:bg-[#1e1e1e]/60 backdrop-blur-3xl flex flex-col p-2 relative flex-1"
              >
                {/* Product Image Panel */}
                <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-gray-50 dark:bg-black/20 m-1">
                  {/* Badges on Image */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    {listing.price < 50 && (
                      <Badge className="bg-[#b45309] text-white hover:bg-[#b45309] border-none rounded-lg px-3 py-1 text-[8px] font-black uppercase tracking-widest shadow-lg">
                        Best Value
                      </Badge>
                    )}
                    {(listing.products?.categories?.name === 'Meat' || listing.products?.categories?.name === 'Poultry') && (
                      <Badge className="bg-[#1b6b3e] text-white hover:bg-[#1b6b3e] border-none rounded-lg px-3 py-1 text-[8px] font-black uppercase tracking-widest shadow-lg">
                        Gov't Monitored
                      </Badge>
                    )}
                  </div>

                  {listing.products?.image_url ? (
                    <Image
                      src={listing.products.image_url}
                      alt={listing.products?.name || 'Product'}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                      sizes="300px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20 group-hover:scale-110 transition-transform duration-700">
                       <ShoppingBag className="w-12 h-12 text-gray-400 dark:text-green-500" />
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-6 flex-1 flex flex-col">
                  {/* Metadata */}
                  <div className="space-y-1.5">
                    <h3 className="text-[1.3rem] font-serif font-black text-gray-900 dark:text-white tracking-tight leading-[1.1] uppercase">
                      {listing.products?.name}
                    </h3>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                      {listing.products?.categories?.name} <span className="mx-1 opacity-30">•</span> {listing.products?.unit || 'UNIT'}
                    </p>
                  </div>

                  {/* Vendor Mini-Card - Only show if not and a specific stall view */}
                  {!vendorId && (
                    <Link 
                      href={`/stalls/${listing.vendor_id}`}
                      className="p-4 rounded-2xl bg-gray-50/50 dark:bg-black/20 border border-gray-100 dark:border-white/5 flex items-center gap-4 hover:bg-white dark:hover:bg-green-950/20 hover:border-green-200 dark:hover:border-green-700/30 transition-all group/vendor cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center shadow-sm group-hover/vendor:text-green-700 dark:group-hover/vendor:text-green-400 transition-colors">
                        <Store className="w-4 h-4 text-gray-400 dark:text-gray-600 group-hover/vendor:text-green-700 dark:group-hover/vendor:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">Stall Vendor</p>
                        <p className="text-[12px] font-black text-gray-900 dark:text-gray-200 truncate leading-none group-hover/vendor:text-green-700 dark:group-hover/vendor:text-green-400 transition-colors">
                          {listing.vendors?.business_name}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-tighter truncate mt-1">
                          Stall {listing.vendors?.stall_number || '1'}
                        </p>
                      </div>
                    </Link>
                  )}

                  {/* Price and Actions Row */}
                  <div className="pt-2 flex items-end justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] leading-none">Estimated Price</p>
                      <div className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tighter flex items-baseline">
                         <span className="text-sm mr-1 font-serif italic text-green-700 dark:text-green-500">₱</span>
                         {listing.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                       <button
                         onClick={(e) => {
                           e.preventDefault()
                           handleAddToCanvass(listing.product_id || listing.id)
                         }}
                         disabled={addingProduct === (listing.product_id || listing.id)}
                         className="w-11 h-11 rounded-2xl bg-gray-900 dark:bg-white/10 hover:bg-green-700 dark:hover:bg-green-600 text-white transition-all flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-50"
                         title="Add to canvass list"
                       >
                         {addingProduct === (listing.product_id || listing.id) ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                         ) : (
                            <Plus className="w-5 h-5" />
                         )}
                       </button>
                       <InquiryTrigger
                        vendorId={listing.vendor_id}
                        listingId={listing.id}
                        productName={listing.products?.name ?? ''}
                        vendorName={listing.vendors?.business_name ?? ''}
                        marketName={marketName}
                        price={listing.price}
                        unit={listing.products?.unit ?? 'unit'}
                        productImage={listing.products?.image_url}
                        triggerLabel=""
                        triggerVariant="ghost"
                        triggerSize="icon"
                        className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-black/30 hover:bg-green-50 dark:hover:bg-green-950/40 text-gray-400 dark:text-gray-600 hover:text-green-700 dark:hover:text-green-400 border border-transparent hover:border-green-100 dark:hover:border-green-900 transition-all flex items-center justify-center active:scale-90 p-0"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center bg-gray-50/50 dark:bg-white/5 rounded-[4rem] border border-dashed border-gray-200 dark:border-white/10">
            <div className="w-24 h-24 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mb-8 shadow-xl">
              <ShoppingBag className="w-10 h-10 text-gray-100 dark:text-gray-800" />
            </div>
            <h3 className="text-2xl font-serif font-black text-gray-300 dark:text-gray-700 uppercase tracking-widest">
              No products active
            </h3>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className={cn(
            "px-8 py-5 rounded-full shadow-[0_20px_100px_rgba(0,0,0,0.3)] flex items-center gap-4 backdrop-blur-3xl border border-white/20 dark:border-white/5 transition-all",
            toast.type === 'success' ? "bg-green-700 text-white" : "bg-gray-900 text-white"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shadow-lg",
              toast.type === 'success' ? "bg-white/20" : "bg-gray-700/50"
            )}>
              {toast.type === 'success' ? <Check className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            </div>
            <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}

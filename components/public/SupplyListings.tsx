'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, Store, Search, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import InquiryTrigger from './InquiryTrigger'

interface Listing {
  id: string
  price: number
  is_available: boolean
  stock_quantity?: number
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
  initialListings: Listing[]
  marketName?: string
}

export default function SupplyListings({ initialListings, marketName = '' }: SupplyListingsProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const categories = useMemo(() => {
    const cats = new Set<string>()
    cats.add('All')
    initialListings.forEach((listing) => {
      const catName = listing.products?.categories?.name
      if (catName) cats.add(catName)
    })
    return Array.from(cats)
  }, [initialListings])

  const filteredListings = useMemo(() => {
    const term = search.toLowerCase().trim()
    return initialListings.filter((listing) => {
      const matchCat = activeCategory === 'All' || listing.products?.categories?.name === activeCategory
      const matchSearch = !term || (listing.products?.name || '').toLowerCase().includes(term)
      return matchCat && matchSearch
    })
  }, [initialListings, activeCategory, search])

  return (
    <div className="space-y-12">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-gray-100 pb-8">
        <div>
          <h2 className="text-3xl font-black text-[#1d631d] uppercase tracking-tight flex items-center gap-2">
            Available <span className="text-gray-900">Supplies</span>
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            Showing {filteredListings.length} items total in {marketName}
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-full md:w-56">
            <Select value={activeCategory} onValueChange={setActiveCategory}>
              <SelectTrigger className="h-11 rounded-full border-gray-100 bg-white shadow-sm font-black text-[10px] uppercase tracking-widest px-6 focus:ring-[#1d631d]">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-[#1d631d]" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gray-100 shadow-xl p-2">
                {categories.map((cat) => (
                  <SelectItem 
                    key={cat} 
                    value={cat}
                    className="rounded-xl font-bold text-[10px] uppercase tracking-widest py-3 focus:bg-[#f0f7f0] focus:text-[#1d631d] cursor-pointer"
                  >
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative w-full md:w-64">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
               type="text"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Search..."
               className="w-full h-11 pl-11 pr-4 rounded-full bg-gray-50 border-gray-100 focus:ring-2 focus:ring-[#1d631d] text-sm font-bold placeholder:text-gray-300 transition-all border outline-none"
             />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div>
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <Card
                key={listing.id}
                className="group overflow-hidden border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2rem] bg-white p-6 flex flex-col gap-5 relative flex-1"
              >
                {/* Optional 'Best Value' Tag - just for UI demonstration like in the image */}
                {listing.price < 50 && (
                   <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-[#1d631d] text-white hover:bg-[#1d631d] border-none rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest shadow-lg">
                        Best Value
                      </Badge>
                   </div>
                )}

                {/* Product Image */}
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-50">
                  {listing.products?.image_url ? (
                    <Image
                      src={listing.products.image_url}
                      alt={listing.products?.name || 'Product'}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      sizes="300px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                       <ShoppingBag className="w-12 h-12 text-gray-200" />
                    </div>
                  )}
                </div>

                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ShoppingBag className="w-3.5 h-3.5 text-[#1d631d]" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">
                        {listing.products?.categories?.name || 'General'}
                      </span>
                    </div>
                    {listing.is_available ? (
                      <Badge className="bg-green-50 text-green-600 border-none font-black text-[8px] uppercase tracking-widest py-1 px-3 rounded-full shrink-0">
                        In Stock
                      </Badge>
                    ) : (
                      <Badge className="bg-red-50 text-red-600 border-none font-black text-[8px] uppercase tracking-widest py-1 px-3 rounded-full shrink-0">
                        Sold Out
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none truncate">
                      {listing.products?.name}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                      Per {listing.products?.unit || 'unit'}
                    </p>
                  </div>

                  {/* Price Box */}
                  <div className="p-6 rounded-2xl bg-[#f8faf8] border border-[#f0f4f0] flex flex-col items-center justify-center gap-1 group-hover:bg-[#f0f7f0] transition-colors mt-2 shadow-inner">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Price Estimate</span>
                    <div className="text-4xl font-black text-[#1d631d] tracking-tighter">
                      ₱{listing.price.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    {/* Vendor Link */}
                    <Link 
                      href={`/stalls/${listing.vendor_id}`} 
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-50 hover:border-[#1d631d]/30 transition-all hover:shadow-sm group/vendor"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover/vendor:bg-[#f0f7f0] transition-colors">
                        <Store className="w-4 h-4 text-gray-400 group-hover/vendor:text-[#1d631d]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Vendor</div>
                        <div className="text-xs font-black text-gray-900 uppercase tracking-tight truncate group-hover/vendor:text-[#1d631d] transition-colors">
                          {listing.vendors?.business_name || 'Market Vendor'}
                        </div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          Stall {listing.vendors?.stall_number || 'TBA'}
                        </div>
                      </div>
                    </Link>

                    <InquiryTrigger
                      vendorId={listing.vendor_id}
                      listingId={listing.id}
                      productName={listing.products?.name ?? ''}
                      vendorName={listing.vendors?.business_name ?? ''}
                      marketName={marketName}
                      price={listing.price}
                      unit={listing.products?.unit ?? 'unit'}
                      triggerLabel="Ask vendor"
                      triggerVariant="outline"
                      triggerSize="default"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest">
              No products found
            </h3>
          </div>
        )}
      </div>
    </div>
  )
}

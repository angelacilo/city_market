'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ShoppingBag, Store } from 'lucide-react'
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
    if (activeCategory === 'All') return initialListings
    return initialListings.filter(
      (listing) => listing.products?.categories?.name === activeCategory
    )
  }, [initialListings, activeCategory])

  return (
    <div className="space-y-8">
      <Tabs
        defaultValue="All"
        value={activeCategory}
        onValueChange={setActiveCategory}
        className="w-full"
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
                Available <span className="text-green-600">Supplies</span>
              </h2>
              <Badge variant="outline" className="text-gray-400 font-bold px-3 py-1 radius-full border-gray-100 italic">
                {filteredListings.length} items
              </Badge>
            </div>
          </div>
          <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-2 justify-start mb-4">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="h-10 px-6 rounded-2xl border border-gray-50 bg-white shadow-sm data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all font-black text-[10px] uppercase tracking-widest italic"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={activeCategory} className="mt-0">
          {filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredListings.map((listing) => (
                <Card
                  key={listing.id}
                  className="group overflow-hidden border-gray-100 shadow-sm hover:shadow-2xl hover:border-green-600/20 transition-all duration-500 rounded-[2.5rem] bg-white p-8 flex flex-col gap-6"
                >
                  {/* Image (optional) */}
                  {listing.products?.image_url && (
                    <div className="relative w-full h-40 rounded-[2rem] overflow-hidden border border-gray-100 bg-gray-50">
                      <Image
                        src={listing.products.image_url}
                        alt={listing.products?.name || 'Product image'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="600px"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-50 rounded-3xl flex items-center justify-center border border-green-100 shadow-inner group-hover:scale-110 transition-transform">
                          <ShoppingBag className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <Badge variant="secondary" className="bg-gray-50 text-gray-400 font-bold text-[8px] uppercase tracking-widest italic border-gray-100 py-1 px-3">
                            {listing.products?.categories?.name || 'General'}
                          </Badge>
                          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic leading-none mt-1">
                            {listing.products?.name}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest italic">
                        Per {listing.products?.unit || 'unit'}
                      </div>
                    </div>
                    {listing.is_available ? (
                      <Badge className="bg-green-50 text-green-600 border border-green-100 font-black text-[9px] uppercase tracking-widest italic py-1.5 px-3 rounded-full">
                        {listing.stock_quantity ? `${listing.stock_quantity} In stock` : 'In stock'}
                      </Badge>
                    ) : (
                      <Badge className="bg-red-50 text-red-600 border border-red-100 font-black text-[9px] uppercase tracking-widest italic py-1.5 px-3 rounded-full">
                        Out of stock
                      </Badge>
                    )}
                  </div>

                  <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-50 flex flex-col items-center justify-center gap-1 group-hover:bg-green-50 transition-colors">
                    <span className="text-sm font-black text-gray-400 uppercase tracking-widest italic mb-2">Price Estimate</span>
                    <div className="text-5xl font-black text-green-600 italic tracking-tighter">
                      &#8369;{listing.price.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-gray-50 shadow-sm">
                      <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
                        <Store className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic leading-none">Vendor</div>
                        <div className="text-sm font-black text-gray-900 uppercase tracking-tight italic">
                          {listing.vendors?.business_name || 'Market Vendor'}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic flex items-center gap-1">
                          Stall {listing.vendors?.stall_number || 'TBA'}
                        </div>
                      </div>
                    </div>

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
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest italic">
                No products in this category yet.
              </h3>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

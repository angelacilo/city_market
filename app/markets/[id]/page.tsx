import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Info, ArrowDown, History, Store, Users, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import SupplyListings from '@/components/public/SupplyListings'
import { cn } from '@/lib/utils'

interface MarketDetailPageProps {
  params: Promise<{ id: string }>
}

const marketColors: Record<string, string> = {
  'Divisoria Market': 'bg-green-100/50 text-green-600',
  'Cogon Market': 'bg-orange-100/50 text-orange-600',
  'Pili Market': 'bg-blue-100/50 text-blue-600',
  'Libertad Public Market': 'bg-purple-100/50 text-purple-600',
  'Agora Market': 'bg-teal-100/50 text-teal-600',
  'Robinsons Wet Market': 'bg-indigo-100/50 text-indigo-600',
}

const defaultColor = 'bg-gray-100 text-gray-600'

export default async function MarketDetailPage({ params }: MarketDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch all relevant data in parallel
  const [marketResult, listingsResult, vendorsResult, productsCountResult] = await Promise.all([
    supabase
      .from('markets')
      .select('id, name, barangay, address, description, image_url')
      .eq('id', id)
      .single(),
    supabase
      .from('price_listings')
      .select(`
        id, 
        price, 
        is_available, 
        vendor_id,
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
      .eq('market_id', id)
      .eq('is_available', true),
    supabase
      .from('vendors')
      .select('id, business_name, owner_name, stall_number, contact_number')
      .eq('market_id', id)
      .eq('is_approved', true)
      .order('business_name', { ascending: true }),
    supabase
      .from('price_listings')
      .select('*', { count: 'exact', head: true })
      .eq('market_id', id)
      .eq('is_available', true),
  ])

  const market = marketResult.data
  if (!market || marketResult.error) {
    notFound()
  }

  const listings = listingsResult.data || []
  const vendors = vendorsResult.data || []
  const vendorsCount = vendors.length
  const productsCount = productsCountResult.count || 0

  const colorClass = marketColors[market.name] || defaultColor

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Full-width Hero Section */}
      <section className="relative h-[25vh] sm:h-[40vh] w-full group overflow-hidden">
        {market.image_url ? (
          <Image
            src={market.image_url}
            alt={market.name}
            fill
            priority
            className="object-cover group-hover:scale-110 transition-transform duration-[20s] ease-linear"
          />
        ) : (
          <div className={cn("w-full h-full flex flex-col items-center justify-center gap-4", colorClass.split(' ')[0])}>
             <Store className={cn("w-20 h-20 sm:w-32 sm:h-32 opacity-30", colorClass.split(' ')[1])} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-gray-50/10" />
      </section>

      {/* Info Card Overlay Container */}
      <section className="relative max-w-6xl mx-auto w-full px-4 -mt-32 sm:-mt-52 z-10 pb-20">
        <Card className="rounded-[2.5rem] bg-white border-transparent shadow-2xl overflow-hidden p-8 sm:p-16 space-y-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="space-y-6 flex-1">
              <div className="inline-flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest">
                 <Store className="w-4 h-4" />
                 Market Details
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tight sm:text-7xl">
                  {market.name}
                </h1>
                
                <div className="flex flex-wrap gap-4 items-center sm:gap-6">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-50 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                    <MapPin className="w-4 h-4 text-green-600" />
                    {market.barangay}, {market.address || 'Butuan City'}
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-green-600/10 text-green-700 border-green-100 px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-1.5">
                       <Users className="w-3 h-3" />
                       {vendorsCount} Vendors
                    </Badge>
                    <Badge className="bg-green-600/10 text-green-700 border-green-100 px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-1.5">
                       <ShoppingBag className="w-3 h-3" />
                       {productsCount} Price Listings
                    </Badge>
                  </div>
                </div>
              </div>

              {market.description && (
                <div className="p-10 rounded-[2rem] bg-gray-50 border border-gray-50 group group-hover:bg-white transition-all shadow-inner">
                  <p className="text-lg text-gray-500 font-medium leading-relaxed text-justify">
                    &quot;{market.description}&quot;
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-72 shrink-0">
               <Link href={`/compare?market=${market.id}`} className="w-full">
                  <Button className="w-full h-16 rounded-2xl bg-gray-900 hover:bg-black text-white font-black uppercase text-xs tracking-widest transition-all shadow-xl flex items-center justify-center gap-3">
                    Compare prices
                    <History className="w-4 h-4" />
                  </Button>
               </Link>
               <Link href="#supplies-section" className="w-full">
                 <Button 
                  variant="outline"
                  className="w-full h-16 rounded-2xl border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-100 font-black uppercase text-xs tracking-widest transition-all shadow-xl flex items-center justify-center gap-3"
                 >
                   View supplies
                   <ArrowDown className="w-4 h-4 animate-bounce" />
                 </Button>
               </Link>
            </div>
          </div>

          {/* Section Divider */}
          <div id="supplies-section" className="pt-12 border-t border-gray-50">
             <SupplyListings initialListings={listings} marketName={market.name} />
          </div>
        </Card>
      </section>
    </div>
  )
}

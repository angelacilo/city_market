import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Navigation, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SupplyListings from '@/components/public/SupplyListings'
import { cn } from '@/lib/utils'

interface MarketDetailPageProps {
  params: Promise<{ id: string }>
}



export default async function MarketDetailPage({ params }: MarketDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch all relevant data in parallel
  const [marketResult, vendorsCountResult, productsCountResult] = await Promise.all([
    supabase
      .from('markets')
      .select('id, name, barangay, address, description, image_url')
      .eq('id', id)
      .single(),
    supabase
      .from('vendors')
      .select('id', { count: 'exact', head: true })
      .eq('market_id', id)
      .eq('is_approved', true),
    supabase
      .from('price_listings')
      .select('id', { count: 'exact', head: true })
      .eq('market_id', id)
      .eq('is_available', true),
  ])

  const market = marketResult.data
  if (!market || marketResult.error) {
    notFound()
  }

  const vendorsCount = vendorsCountResult.count || 0
  const productsCount = productsCountResult.count || 0

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Cinematic Hero Section */}
      <section className="relative h-[65vh] w-full overflow-hidden">
        {market.image_url ? (
          <Image
            src={market.image_url}
            alt={market.name}
            fill
            priority
            className="object-cover scale-105"
          />
        ) : (
          <div className="w-full h-full bg-green-900" />
        )}
        
        {/* Dark Overlay/Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute inset-0 max-w-7xl mx-auto px-6 flex flex-col justify-center">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            
            {/* Left Side Info */}
            <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-left-8 duration-700">
               <Badge className="bg-[#1d631d] text-white hover:bg-[#1d631d] border-none px-4 py-1 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl">
                 Official Verified Market
               </Badge>

               <div className="space-y-4 text-white">
                  <h1 className="text-6xl sm:text-8xl font-serif leading-[0.9] tracking-tight drop-shadow-2xl font-bold">
                    {market.name}
                  </h1>
                  <div className="flex items-center gap-2 text-white/80 font-bold uppercase tracking-widest text-xs">
                    <MapPin className="w-4 h-4 text-green-400" />
                    {market.barangay}, {market.address || 'Butuan City'}
                  </div>
               </div>

               {/* Stat Boxes */}
               <div className="flex gap-4 pt-4">
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-xl min-w-[140px] shadow-2xl">
                    <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Active Vendors</p>
                    <p className="text-white text-3xl font-black">{vendorsCount}</p>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-xl min-w-[140px] shadow-2xl">
                    <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Price Listings</p>
                    <p className="text-white text-3xl font-black">{productsCount}</p>
                  </div>
               </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex flex-col gap-4 w-full sm:w-72 animate-in fade-in slide-in-from-right-8 duration-700">
               <Link href={`/compare?market=${market.id}`} className="w-full">
                 <Button className="w-full h-16 rounded-full bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs tracking-widest transition-all shadow-2xl flex items-center justify-between px-8 group active:scale-95">
                   Compare prices
                   <Navigation className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                 </Button>
               </Link>
               <Link href="#supplies-section" className="w-full">
                 <Button className="w-full h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 text-white font-black uppercase text-xs tracking-widest transition-all shadow-2xl flex items-center justify-between px-8 group active:scale-95">
                   View supplies
                   <Package className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                 </Button>
               </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Supplies Grid Section */}
      <section id="supplies-section" className="max-w-7xl mx-auto w-full px-6 py-20">
         <div className="scroll-mt-24">
            <SupplyListings marketId={id} marketName={market.name} />
         </div>
      </section>


    </div>
  )
}

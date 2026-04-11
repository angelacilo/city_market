import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Phone, Store, ChevronLeft, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import SupplyListings from '@/components/public/SupplyListings'
import LiveStatusBadge from '@/components/public/LiveStatusBadge'
import { format, parse } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MessageCircle, Navigation, Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StallProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the Stall details securely
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select(`
      id,
      business_name,
      owner_name,
      contact_number,
      stall_number,
      is_approved,
      market_id,
      opening_time,
      closing_time,
      markets ( id, name, barangay )
    `)
    .eq('id', id)
    .single()

  // Ensure stall exists and is approved before displaying it publicly
  if (error || !vendor || !vendor.is_approved) {
    notFound()
  }
 
  // Calculate if open
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()
  
  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }
 
  const isOpen = vendor.opening_time && vendor.closing_time 
    ? (currentTime >= parseTime(vendor.opening_time) && currentTime <= parseTime(vendor.closing_time))
    : true // Default to true if not set
 
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--:--'
    try {
      const date = parse(timeStr, 'HH:mm:ss', new Date())
      return format(date, 'hh:mm a')
    } catch {
       return timeStr
    }
  }

  // Fetch specifically this stall's live prices to render the grid
  const { data: listings } = await supabase
    .from('price_listings')
    .select(`
      id, 
      price, 
      is_available,
      vendor_id,
      stock_quantity,
      products ( name, unit, image_url, categories ( name ) ),
      vendors ( id, business_name, stall_number, contact_number ),
      markets ( name )
    `)
    .eq('vendor_id', vendor.id)
    .eq('is_available', true)

  const productsCount = listings?.length || 0
  const stockCount = listings?.reduce((acc, curr) => acc + (curr.stock_quantity || 0), 0) || 0

  return (
    <div className="min-h-screen bg-white dark:bg-[#050a05] flex flex-col transition-colors duration-500">
      {/* Cinematic Hero Section - Stall Edition */}
      <section className="relative h-[65vh] w-full overflow-hidden bg-[#0a2e10]">
         {/* Background Pattern / Gradient */}
         <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000')] bg-cover bg-center opacity-30 mix-blend-multiply" />
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />

         <div className="absolute inset-0 max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-14 flex flex-col justify-center z-20">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
               
               {/* Left Side Info */}
               <div className="space-y-8 max-w-3xl animate-in fade-in slide-in-from-left-8 duration-700">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="bg-[#1b6b3e] text-white hover:bg-[#1b6b3e] border-none px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl">
                      Verified Stall #{vendor.stall_number || 'N/A'}
                    </Badge>
                    <LiveStatusBadge openingTime={vendor.opening_time} closingTime={vendor.closing_time} />
                  </div>

                  <div className="space-y-4 text-white">
                     <h1 className="text-6xl sm:text-8xl font-serif leading-[0.9] tracking-tight drop-shadow-2xl font-bold uppercase">
                       {vendor.business_name}
                     </h1>
                     <div className="flex flex-wrap items-center gap-6 text-white/80 font-bold uppercase tracking-widest text-[11px]">
                       <div className="flex items-center gap-2">
                         <MapPin className="w-4 h-4 text-green-400" />
                         {(vendor.markets as any)?.name || 'Local Market'}
                       </div>
                       <div className="flex items-center gap-2">
                         <Store className="w-4 h-4 text-green-400" />
                         Principal: {vendor.owner_name}
                       </div>
                     </div>
                  </div>

                  {/* Stat Boxes */}
                  <div className="flex gap-4 pt-4">
                     <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-[1.5rem] min-w-[160px] shadow-2xl">
                       <p className="text-white/60 text-[9px] font-black uppercase tracking-widest mb-1.5">Listed Products</p>
                       <p className="text-white text-4xl font-black tabular-nums">{productsCount}</p>
                     </div>
                     <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-[1.5rem] min-w-[160px] shadow-2xl">
                       <p className="text-white/60 text-[9px] font-black uppercase tracking-widest mb-1.5">Available Stock</p>
                       <p className="text-white text-4xl font-black tabular-nums">{stockCount}</p>
                     </div>
                  </div>
               </div>

               {/* Right Side Actions */}
               <div className="flex flex-col gap-4 w-full sm:w-80 animate-in fade-in slide-in-from-right-8 duration-700">
                  <Link href={`/user/messages?vendor=${vendor.id}`} className="w-full">
                    <Button className="w-full h-18 rounded-[1.5rem] bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs tracking-widest transition-all shadow-2xl flex items-center justify-between px-8 group active:scale-95 py-8">
                      Chat with vendor
                      <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="#listings-section" className="w-full">
                    <Button className="w-full h-18 rounded-[1.5rem] bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 text-white font-black uppercase text-xs tracking-widest transition-all shadow-2xl flex items-center justify-between px-8 group active:scale-95 py-8">
                      View Supplies
                      <Package className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                    </Button>
                  </Link>
                  
                  <Link href={`/markets/${vendor.market_id}`} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors mt-4 self-center lg:self-start">
                    <ChevronLeft className="w-4 h-4" />
                    Back to Market
                  </Link>
               </div>
            </div>
         </div>
      </section>

      {/* Supplies Grid Section */}
      <section id="listings-section" className="max-w-[1600px] w-full mx-auto px-6 sm:px-10 lg:px-14 py-20 bg-white dark:bg-[#050a05] transition-colors duration-500">
         <div className="scroll-mt-24">
            <SupplyListings marketId={vendor.market_id} vendorId={vendor.id} marketName={(vendor.markets as any)?.name || 'Market'} />
            {productsCount === 0 && (
              <div className="py-40 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10 dark:shadow-[0_0_50px_-10px_rgba(27,107,62,0.1)] transition-all">
                <Store className="w-16 h-16 text-gray-200 dark:text-gray-800 mb-6" />
                <h3 className="text-2xl font-serif font-black text-gray-300 dark:text-gray-700 uppercase tracking-widest">No Active Listings</h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest mt-2">Check back later for available products</p>
              </div>
            )}
         </div>
      </section>
    </div>
  )
}

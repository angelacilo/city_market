import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Phone, Store, ChevronLeft, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import SupplyListings from '@/components/public/SupplyListings'
import LiveStatusBadge from '@/components/public/LiveStatusBadge'
import { format, parse } from 'date-fns'
import { cn } from '@/lib/utils'

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-24 pb-20">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        <Link href={`/markets/${vendor.market_id}`} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-green-700 hover:text-green-800 transition-colors mb-8">
          <ChevronLeft className="w-4 h-4" />
          Back to Market Breakdown
        </Link>
        
        {/* Stall Info Header */}
        <div className="bg-white rounded-[2rem] p-8 sm:p-12 shadow-sm border border-gray-100 flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 z-0 pointer-events-none" />
          <div className="relative z-10 flex flex-col items-start gap-4">
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight flex items-center gap-3">
               <Store className="w-10 h-10 sm:w-10 sm:h-10 text-green-600" />
               {vendor.business_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
               <Badge className="bg-green-100/50 text-green-700 hover:bg-green-100 border-none px-4 py-1.5 uppercase font-bold tracking-widest text-[10px] rounded-full">
                 Stall {vendor.stall_number || 'N/A'}
               </Badge>
               <Badge variant="outline" className="text-gray-500 border-gray-200 bg-white px-4 py-1.5 uppercase font-bold tracking-widest text-[10px] rounded-full flex items-center gap-1">
                 <MapPin className="w-3 h-3" />
                 {(vendor.markets as any)?.name || 'Local Market'}
               </Badge>
            </div>
            <div className="flex flex-col gap-4 mt-2">
               <LiveStatusBadge openingTime={vendor.opening_time} closingTime={vendor.closing_time} />
            </div>
            
            <div className="mt-4 flex flex-col gap-2 border-l-2 border-green-100 pl-4 py-1">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 Owner / Principal: <span className="text-gray-900">{vendor.owner_name}</span>
               </p>
               {vendor.contact_number && (
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   Contact No: <span className="text-gray-900 flex items-center gap-1"><Phone className="w-3 h-3" /> {vendor.contact_number}</span>
                 </p>
               )}
            </div>
          </div>
        </div>

        {/* Current Supplies Listings block */}
        <div className="mt-8 bg-white rounded-[2rem] border border-gray-100 p-8 sm:p-12 shadow-sm relative overflow-hidden">
           <h2 className="text-lg font-black text-gray-900 tracking-tighter uppercase mb-8 border-b border-gray-100 pb-4">Available Products</h2>
           <SupplyListings marketId={vendor.market_id} vendorId={vendor.id} marketName={(vendor.markets as any)?.name || 'Market'} />
           {(!listings || listings.length === 0) && (
              <p className="text-xs text-gray-400 font-medium py-8 text-center bg-gray-50 rounded-xl">This stall hasn't listed any active products yet. Check back soon.</p>
           )}
        </div>
      </div>
    </div>
  )
}

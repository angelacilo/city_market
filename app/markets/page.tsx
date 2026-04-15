import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import MarketsPageClient from '@/components/public/MarketsPageClient'

export const metadata: Metadata = {
  title: 'Public Markets | Butuan City Market',
  description: 'Browse all public markets in Butuan City and their available supplies.',
}

export default async function MarketsPage() {
  const supabase = await createClient()

  // Parallel fetch counts
  const [
    { count: marketsCount },
    { count: vendorsCount },
    { count: productsCount }
  ] = await Promise.all([
    supabase.from('markets').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('is_approved', true),
    supabase.from('products').select('*', { count: 'exact', head: true }),
  ])

  // Fetch market data
  const { data: marketsData } = await supabase
    .from('markets')
    .select(`
      id,
      name,
      barangay,
      image_url,
      is_active,
      vendors_count: vendors(count),
      products_count: price_listings(count),
      price_listings (
        products (
          name
        )
      )
    `)
    .eq('is_active', true)
    .order('name')

  const markets = (marketsData || []).map((m: any) => {
    const productNames = m.price_listings
      ? Array.from(new Set(m.price_listings.map((l: any) => l.products?.name).filter(Boolean)))
      : []
    
    return {
      id: m.id,
      name: m.name,
      vendors_count: m.vendors_count?.[0]?.count || 0,
      products_count: m.products_count?.[0]?.count || 0,
      image_url: m.image_url,
      product_names: productNames as string[],
    }
  })

  return (
    <div className="min-h-screen bg-[#f0f7f0] dark:bg-[#050a05] transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* HERO SECTION */}
        <section className="pt-16 pb-10 grid grid-cols-1 md:grid-cols-[55%_45%] gap-10 items-center">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            <div className="bg-green-100 border border-green-200 rounded-full px-3 py-1 self-start">
              <span className="text-[10px] font-bold tracking-widest text-green-700 uppercase">
                VERIFIED CITY PORTAL
              </span>
            </div>
            
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none uppercase italic font-serif">
              <span className="block text-gray-900 dark:text-white">MARKETS IN</span>
              <span className="block text-green-700 dark:text-green-500">BUTUAN CITY</span>
            </h1>

            <div className="max-w-sm space-y-2">
              <p className="text-sm sm:text-base font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] leading-relaxed">
                BROWSE ALL PUBLIC MARKETS AND THEIR AVAILABLE SUPPLIES.
              </p>
              <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                Real-time updates on availability and local trade flow.
              </p>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 md:flex md:flex-row gap-4 h-fit">
            <div className="bg-white dark:bg-[#0a0f0a] rounded-2xl border border-gray-100 dark:border-white/5 px-6 py-6 shadow-sm dark:shadow-[0_0_30px_-5px_rgba(27,107,62,0.1)] flex-1 min-w-[140px] transition-all hover:-translate-y-1">
              <div className="text-4xl font-black text-green-700 dark:text-green-500 font-serif italic mb-1">
                {marketsCount || 0}
              </div>
              <div className="text-[9px] font-black tracking-[0.2em] text-gray-400 dark:text-gray-600 uppercase">
                ACTIVE MARKETS
              </div>
            </div>

            <div className="bg-white dark:bg-[#0a0f0a] rounded-2xl border border-gray-100 dark:border-white/5 px-6 py-6 shadow-sm dark:shadow-[0_0_30px_-5px_rgba(27,107,62,0.1)] flex-1 min-w-[140px] transition-all hover:-translate-y-1">
              <div className="text-4xl font-black text-green-700 dark:text-green-500 font-serif italic mb-1">
                {vendorsCount || 0}
              </div>
              <div className="text-[9px] font-black tracking-[0.2em] text-gray-400 dark:text-gray-600 uppercase">
                APPROVED VENDORS
              </div>
            </div>

            <div className="bg-white dark:bg-[#0a0f0a] rounded-2xl border border-gray-100 dark:border-white/5 px-6 py-6 shadow-sm dark:shadow-[0_0_30px_-5px_rgba(27,107,62,0.1)] flex-1 min-w-[140px] transition-all hover:-translate-y-1">
              <div className="text-4xl font-black text-green-700 dark:text-green-500 font-serif italic mb-1">
                {productsCount || 0}
              </div>
              <div className="text-[9px] font-black tracking-[0.2em] text-gray-400 dark:text-gray-600 uppercase">
                PRODUCT CATALOG
              </div>
            </div>
          </div>
        </section>

        {/* Filters and Grid */}
        <MarketsPageClient initialMarkets={markets} />
        
        {/* Padding at bottom */}
        <div className="pb-20" />
      </div>
    </div>
  )
}

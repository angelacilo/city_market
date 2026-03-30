import { createClient } from '@/lib/supabase/server'
import MarketFilters from '@/components/public/MarketFilters'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Public Markets | BCMIS',
  description: 'Browse all public markets in Butuan City and their available supplies.',
}

export default async function MarketsPage() {
  const supabase = await createClient()

  // Fetch metrics in parallel
  const [
    { count: marketsCount },
    { count: vendorsCount },
    { count: productsCount }
  ] = await Promise.all([
    supabase.from('markets').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('is_approved', true),
    supabase.from('products').select('*', { count: 'exact', head: true }),
  ])

  // Fetch markets with stats
  // We use nested count selects for relational counts
  const { data: marketsData } = await supabase
    .from('markets')
    .select(`
      id,
      name,
      barangay,
      image_url,
      is_active,
      vendors_count: vendors(count),
      products_count: price_listings(count)
    `)
    .eq('is_active', true)
    .order('name')

  // Transform data to simplify counts (Supabase returns count as an array-ish object)
  const markets = (marketsData || []).map((m: any) => ({
    ...m,
    vendors_count: m.vendors_count?.[0]?.count || 0,
    products_count: m.products_count?.[0]?.count || 0,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header Section */}
      <header className="bg-white border-b border-gray-100 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 uppercase tracking-tight italic">
              Markets in <span className="text-green-600">Butuan City</span>
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2 italic">
              Browse all public markets and their available supplies.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 md:gap-16">
            <div className="flex flex-col">
              <span className="text-3xl font-black text-green-600 italic tracking-tighter">
                {marketsCount || 0}
              </span>
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic">
                Active Markets
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-green-600 italic tracking-tighter">
                {vendorsCount || 0}
              </span>
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic">
                Approved Vendors
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-green-600 italic tracking-tighter">
                {productsCount || 0}
              </span>
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic">
                Product Catalog
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sticky Filters */}
      <MarketFilters initialMarkets={markets} />
    </div>
  )
}

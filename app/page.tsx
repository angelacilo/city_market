import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Hero from '@/components/home/Hero'
import LivePriceTicker, { type TickerItem } from '@/components/home/LivePriceTicker'
import CategoriesSection from '@/components/home/CategoriesSection'
import MarketsSection from '@/components/home/MarketsSection'
import VendorCTA from '@/components/home/VendorCTA'
import PriceSnapshotTable from '@/components/public/PriceSnapshotTable'
import type { MarketWithStats, PriceSnapshot } from '@/types'

export const metadata: Metadata = {
  title: 'Butuan City Market Information System',
  description: 'Find the best prices across all public markets in Butuan City, Agusan del Norte.',
}

export const revalidate = 60

export default async function LandingPage() {
  const supabase = await createClient()

  const [
    { count: marketCount },
    { count: vendorCount },
    { count: productCount },
    { data: marketsData },
    { data: snapshot },
    { data: categoriesData },
  ] = await Promise.all([
    supabase.from('markets').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('is_approved', true),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('markets').select(`
      id, 
      name, 
      barangay, 
      image_url, 
      is_active,
      vendors_count: vendors(count),
      products_count: price_listings(count)
    `).eq('is_active', true).order('name'),
    supabase.from('price_listings').select(`
      id, price, is_available, last_updated,
      products ( name, unit ),
      vendors ( business_name, stall_number ),
      markets ( name )
    `).eq('is_available', true).order('price', { ascending: true }).limit(5),
    supabase.from('categories').select('id, name, icon').order('name'),
  ])

  const markets = (marketsData || []).map((m) => ({
    ...m,
    vendors_count: m.vendors_count?.[0]?.count || 0,
    products_count: m.products_count?.[0]?.count || 0,
  })) as MarketWithStats[]

  const { data: tickerListings } = await supabase
    .from('price_listings')
    .select(`id, price, last_updated, products ( name, unit )`)
    .eq('is_available', true)
    .order('last_updated', { ascending: false })
    .limit(3)

  const tickerIds = (tickerListings || []).map((l) => l.id)
  const { data: tickerHistories } =
    tickerIds.length > 0
      ? await supabase
        .from('price_history')
        .select('listing_id, price, recorded_at')
        .in('listing_id', tickerIds)
        .order('recorded_at', { ascending: false })
      : { data: [] as { listing_id: string; price: number; recorded_at: string }[] }

  const groupedHistory = new Map<string, { price: number; recorded_at: string }[]>()
  for (const h of tickerHistories || []) {
    const arr = groupedHistory.get(h.listing_id) || []
    arr.push({ price: Number(h.price), recorded_at: h.recorded_at })
    groupedHistory.set(h.listing_id, arr)
  }
  for (const arr of groupedHistory.values()) {
    arr.sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    )
  }

  const tickerItems: TickerItem[] = (tickerListings || []).map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products
    const name = product?.name || 'Product'
    const unit = product?.unit || 'unit'
    const current = Number(row.price)
    const hist = groupedHistory.get(row.id) || []
    let prev: number | undefined
    if (hist.length >= 2) prev = hist[1].price
    else if (hist.length === 1 && Math.abs(hist[0].price - current) > 0.001) prev = hist[0].price

    let changePct: number | null = null
    if (prev != null && prev !== 0) {
      changePct = Math.round(((current - prev) / prev) * 1000) / 10
    }

    return {
      id: row.id,
      name,
      unit,
      price: current,
      changePct,
    }
  })

  const snapshotRows: PriceSnapshot[] = ((snapshot as PriceSnapshot[] | null) || []).map(
    (s: PriceSnapshot) => ({
      ...s,
      products: Array.isArray(s.products) ? s.products[0] : s.products,
      vendors: Array.isArray(s.vendors) ? s.vendors[0] : s.vendors,
      markets: Array.isArray(s.markets) ? s.markets[0] : s.markets,
    })
  )

  void vendorCount
  void productCount
  void categoriesData

  // Fetch popular products for Hero tags
  const { data: popularData } = await supabase
    .from('price_listings')
    .select('products(name)')
    .limit(10)
  
  const popularTags = Array.from(new Set((popularData || [])
    .map(p => {
      const product = Array.isArray(p.products) ? p.products[0] : p.products
      return product?.name
    })
    .filter(Boolean)))
    .slice(0, 4) as string[]

  // Calculate real-time insight from system data
  let insight: { type: 'down' | 'up'; product: string; change: string; reason: string } | undefined
  const itemsWithChange = tickerItems.filter(item => item.changePct !== null)
  if (itemsWithChange.length > 0) {
    const biggestChange = itemsWithChange.reduce((prev, current) => 
      (Math.abs(current.changePct!) > Math.abs(prev.changePct!)) ? current : prev
    )
    insight = {
      type: (biggestChange.changePct! < 0) ? 'down' : 'up',
      product: biggestChange.name,
      change: `${Math.abs(biggestChange.changePct!)}%`,
      reason: `System analysis shows a ${biggestChange.changePct! < 0 ? 'notable price drop' : 'slight increase'} for ${biggestChange.name} in the latest market updates.`
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Hero 
        tickerItems={tickerItems.map(t => ({ name: t.name, price: t.price, unit: t.unit, change: t.changePct }))} 
        popularTags={popularTags.length > 0 ? popularTags : undefined}
        insight={insight}
      />
      <CategoriesSection />
      <MarketsSection
        markets={markets}
        showAllHref="/markets"
        showAllLabel={`Show all ${marketCount ?? markets.length} markets`}
      />
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-gray-900 leading-tight">
                <span className="block text-4xl font-black text-gray-900">Price</span>
                <span className="block text-4xl font-serif italic font-medium text-green-700">Snapshot</span>
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Lowest listed prices right now — updated from live vendor listings.
              </p>
            </div>
            <Link
              href="/compare"
              className="text-[#1b6b3e] font-black uppercase tracking-widest text-[10px] border-b-2 border-[#1b6b3e] pb-1 hover:text-green-800 transition-colors"
            >
              Full comparisons →
            </Link>
          </div>
          <PriceSnapshotTable listings={snapshotRows} />
        </div>
      </section>
      <VendorCTA />
    </div>
  )
}


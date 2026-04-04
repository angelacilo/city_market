import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import SearchResultsWrapper, { SearchListing } from '@/components/public/SearchResultsWrapper'

export const revalidate = 30

const SLUG_TO_CATEGORY: Record<string, string> = {
  'rice-and-grains': 'Rice and Grains',
  meat: 'Meat',
  seafood: 'Seafood',
  vegetables: 'Vegetables',
  fruits: 'Fruits',
  'dry-goods': 'Dry Goods',
  condiments: 'Condiments',
  others: 'Others',
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const catName = category ? SLUG_TO_CATEGORY[category] : null
  if (catName) {
    return {
      title: `${catName} — Butuan Market IS`,
      description: `Browse all ${catName.toLowerCase()} products across Butuan City public markets.`,
    }
  }
  return {
    title: 'All Products — Butuan Market IS',
    description: 'Browse products across all Butuan City public markets.',
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const categoryName = category ? SLUG_TO_CATEGORY[category] : null

  const supabase = await createClient()

  // Build query — filter by category if one is specified
  let query = supabase
    .from('price_listings')
    .select(`
      id, price, is_available, vendor_id,
      products!inner(name, unit, categories!inner(name)),
      vendors(business_name, stall_number, contact_number),
      markets(name, barangay)
    `)
    .eq('is_available', true)
    .order('price', { ascending: true })

  if (categoryName) {
    query = query.eq('products.categories.name', categoryName)
  }

  const { data: listings } = await query
  const typedListings = (listings || []) as SearchListing[]

  // If no category and no listings, redirect to search
  if (!categoryName && typedListings.length === 0) {
    redirect('/search')
  }

  // Aggregates
  const distinctMarkets = Array.from(
    new Set(typedListings.map((l) => l.markets?.name).filter(Boolean))
  ) as string[]
  const lowestPrice = typedListings.length > 0 ? Math.min(...typedListings.map((l) => l.price)) : 0
  const highestPrice = typedListings.length > 0 ? Math.max(...typedListings.map((l) => l.price)) : 0
  const marketCount = distinctMarkets.length
  const vendorCount = new Set(typedListings.map((l) => l.vendor_id)).size

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 py-6 px-4 sm:px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-colors cursor-pointer group"
            >
              <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-green-600 transition-colors" />
            </Link>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
              {categoryName ?? 'All Products'}
            </h1>
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest italic text-right pl-4">
            {typedListings.length} listings
            {marketCount > 0 ? ` across ${marketCount} markets` : ''}
          </span>
        </div>
      </header>

      {typedListings.length > 0 ? (
        <SearchResultsWrapper
          initialListings={typedListings}
          lowestPrice={lowestPrice}
          highestPrice={highestPrice}
          marketCount={marketCount}
          vendorCount={vendorCount}
          availableMarkets={distinctMarkets}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-6 mt-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
            <ChevronLeft className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">
            No {categoryName?.toLowerCase() || ''} products available
          </h2>
          <p className="text-gray-500 text-sm font-medium italic">
            None of the vendors are currently listing products in this category. Check back later.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(SLUG_TO_CATEGORY).map(([slug, name]) => (
              <Link key={slug} href={`/products?category=${slug}`}>
                <Badge
                  variant="outline"
                  className={`px-4 py-1.5 rounded-full font-bold uppercase text-[10px] tracking-widest italic cursor-pointer transition-colors ${
                    slug === category
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-green-200 text-green-700 bg-green-50/50 hover:bg-green-600 hover:text-white'
                  }`}
                >
                  {name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

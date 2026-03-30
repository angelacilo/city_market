import { createClient } from '@/lib/supabase/server'
import { Search, ChevronLeft, PackageSearch } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import SearchResultsWrapper, { SearchListing } from '@/components/public/SearchResultsWrapper'

export const revalidate = 30

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q?.trim()
  if (!query) {
    return { title: 'Search | BCMIS', description: 'Search for products in Butuan City.' }
  }
  return {
    title: `Search results for ${query} - Butuan Market IS`,
    description: `Compare prices and find the best deals for ${query} across all Butuan City markets.`,
  }
}

const QUICK_SEARCH_TAGS = [
  'Rice', 'Pork', 'Chicken', 'Bangus', 'Tilapia', 'Onion', 'Garlic', 'Eggs', 'Cooking Oil', 'Cabbage'
]

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q?.trim()

  // Edge case 1: No query or empty query
  if (!query) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 py-6 px-4 sm:px-6 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-colors cursor-pointer group">
                <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-green-600 transition-colors" />
              </Link>
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
                Search
              </h1>
            </div>
          </div>
        </header>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-8 mt-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight italic">Search for a product</h2>
            <p className="text-gray-500 font-medium leading-relaxed italic">
              Type the name of any product such as rice, pork, or bangus in the search bar above to find where it is sold and at what price across all Butuan markets.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {QUICK_SEARCH_TAGS.map(tag => (
              <Link key={tag} href={`/search?q=${tag}`}>
                <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50/50 hover:bg-green-600 hover:text-white transition-colors cursor-pointer px-4 py-1.5 rounded-full font-bold uppercase text-[10px] tracking-widest italic">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Fetch data
  const supabase = await createClient()

  const [listingsResult, distinctMarketsResult] = await Promise.all([
    supabase
      .from('price_listings')
      .select(`
        id, price, is_available, vendor_id,
        products!inner(name, unit, categories(name)),
        vendors(business_name, stall_number, contact_number),
        markets(name, barangay)
      `)
      .eq('is_available', true)
      .ilike('products.name', `%${query}%`)
      .order('price', { ascending: true }),
    supabase
      .from('price_listings')
      .select(`markets(name), products!inner(name)`)
      .eq('is_available', true)
      .ilike('products.name', `%${query}%`)
  ])

  const listings = (listingsResult.data || []) as SearchListing[]

  // Edge case 2: No results found
  if (listings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 py-6 px-4 sm:px-6 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-colors cursor-pointer group">
                <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-green-600 transition-colors" />
              </Link>
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
                "{query}"
              </h1>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">
              No results found for this search.
            </span>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-8 mt-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
            <PackageSearch className="w-10 h-10 text-gray-400" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight italic">No results for "{query}"</h2>
            <p className="text-gray-500 font-medium leading-relaxed italic">
              We could not find any available products matching your search in any Butuan market right now. Try searching with a different spelling or a more general term.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {QUICK_SEARCH_TAGS.map(tag => (
              <Link key={tag} href={`/search?q=${tag}`}>
                <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50/50 hover:bg-green-600 hover:text-white transition-colors cursor-pointer px-4 py-1.5 rounded-full font-bold uppercase text-[10px] tracking-widest italic">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Calculate server-side aggregates
  const rawMarkets = distinctMarketsResult.data?.map((r: any) => r.markets?.name).filter(Boolean) || []
  const distinctMarkets = Array.from(new Set(rawMarkets)) as string[]

  const lowestPrice = Math.min(...listings.map((l) => l.price))
  const highestPrice = Math.max(...listings.map((l) => l.price))
  const marketCount = new Set(listings.map((l) => l.markets?.name).filter(Boolean)).size
  const vendorCount = new Set(listings.map((l) => l.vendor_id)).size

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 py-6 px-4 sm:px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-colors cursor-pointer group">
              <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-green-600 transition-colors" />
            </Link>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic truncate max-w-[150px] sm:max-w-none">
              "{query}"
            </h1>
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest italic text-right pl-4">
            {listings.length} listings found across {marketCount} markets.
          </span>
        </div>
      </header>

      {/* Main Results Wrapper */}
      <SearchResultsWrapper
        initialListings={listings}
        lowestPrice={lowestPrice}
        highestPrice={highestPrice}
        marketCount={marketCount}
        vendorCount={vendorCount}
        availableMarkets={distinctMarkets}
      />
    </div>
  )
}

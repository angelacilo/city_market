import Link from 'next/link'
import Image from 'next/image'
import type { MarketWithStats } from '@/types'

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
  'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&q=80',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
  'https://images.unsplash.com/photo-1506484334402-40f21557d66a?w=800&q=80',
  'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&q=80',
  'https://images.unsplash.com/photo-1543083477-4f7fe1921694?w=800&q=80',
]

function formatProductCount(n: number) {
  return `${n.toLocaleString('en-US')}+`
}

export default function MarketCard({
  market,
  index = 0,
}: {
  market: MarketWithStats
  index?: number
}) {
  const imgSrc = market.image_url || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
  const isFirstRow = index < 3

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:border-green-200 hover:shadow-md">
      <div className="relative h-40 w-full flex-shrink-0 overflow-hidden rounded-t-xl md:h-40">
        <Image src={imgSrc} alt={market.name} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-sm bg-green-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          Open now
        </div>
      </div>
      <div className="flex flex-1 flex-col border-x border-b border-gray-100 rounded-b-xl bg-white p-4">
        <h3 className="text-base font-bold text-gray-900">{market.name}</h3>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Registered Vendors</span>
            <span className="font-semibold text-gray-700">{market.vendors_count}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Total Products</span>
            <span className="font-semibold text-gray-700">{formatProductCount(market.products_count)}</span>
          </div>
        </div>
        <div className="mt-4">
          {isFirstRow ? (
            <Link
              href={`/markets/${market.id}`}
              className="flex w-full items-center justify-center rounded-lg bg-gray-100 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              View Price List
            </Link>
          ) : (
            <Link
              href={`/compare?market=${market.id}`}
              className="flex w-full items-center justify-center rounded-lg border border-gray-300 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Track Trends
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

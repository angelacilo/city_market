import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface MarketCardProps {
  market: {
    id: string
    name: string
    vendors_count: number
    products_count: number
    image_url?: string | null
  }
  index: number
}

const MARKET_IMAGES: Record<string, string> = {
  'Agora Market': 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
  'Libertad Public Market': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
  'Cogon Market': 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&q=80',
  'Robinsons Wet Market': 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=800&q=80',
  'Divisoria Market': 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=800&q=80',
  'Pili Market': 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&q=80',
}

export default function MarketCard({ market, index }: MarketCardProps) {
  const isFirstRow = index < 3
  const imageUrl = market.image_url || MARKET_IMAGES[market.name] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80'

  return (
    <Link href={`/markets/${market.id}`} className="group">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col cursor-pointer">
        {/* Image Area */}
        <div className="relative h-[180px] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={market.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-3 right-3 bg-green-600 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block mr-1.5" />
            OPEN NOW
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-gray-900 font-serif mb-3">
            {market.name}
          </h3>

          {isFirstRow ? (
            <div className="mt-auto space-y-2">
              <div className="flex justify-between items-center border-b border-gray-50 pb-2 mb-2">
                <span className="text-xs text-gray-400">Registered Vendors</span>
                <span className="text-sm font-bold text-gray-900">{market.vendors_count.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-2 mb-2">
                <span className="text-xs text-gray-400">Total Products</span>
                <span className="text-sm font-bold text-gray-900">{market.products_count.toLocaleString()}+</span>
              </div>
              <div className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl transition-colors text-center w-full">
                View Price List
              </div>
            </div>
          ) : (
            <div className="mt-auto">
              <div className="w-full border-2 border-green-600 text-green-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-green-50 transition-colors text-center">
                Track Trends
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

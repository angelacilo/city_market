import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

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

const MARKET_DESCRIPTIONS: Record<string, string> = {
  'Agora Market':
    'Central hub for wholesale agricultural products and fresh seafood arrivals.',
  'Cogon Market':
    'Specialized in local organic vegetables and artisanal dry goods from the highlands.',
  'Divisoria Market':
    'Known for bulk grains, condiments, and competitive pricing for household essentials.',
  'Libertad Public Market':
    "The city's historical market district offering the widest variety of fresh livestock.",
  'Pili Market':
    'A neighborhood favorite for ready-to-eat local delicacies and fresh breakfast supplies.',
  'Robinsons Wet Market':
    'Premium selection of high-grade meats and international food components in a modern setting.',
}

export default function MarketCard({ market, index }: MarketCardProps) {
  const imageUrl =
    market.image_url ||
    MARKET_IMAGES[market.name] ||
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80'

  const description =
    MARKET_DESCRIPTIONS[market.name] ||
    "One of Butuan City's public markets serving the community with competitive prices and fresh produce."

  const buttonLabel = index < 3 ? 'View Live Prices' : 'View Price List'

  return (
    <Link href={`/markets/${market.id}`} className="group h-full">
      <div className="flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
        {/* Image Area */}
        <div className="relative h-[200px] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={market.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* OPEN NOW badge — top-left */}
          <div className="absolute left-3 top-3 flex items-center rounded-full bg-green-700 px-2.5 py-1 shadow-sm">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-300" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-white">
              Open Now
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-2 text-xl font-bold text-gray-900 font-sans">
            {market.name}
          </h3>

          <p className="mb-4 text-sm leading-relaxed text-gray-500">
            {description}
          </p>

          {/* Two-column stats */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400">
                Registered Vendors
              </span>
              <span className="text-2xl font-black text-gray-900">
                {market.vendors_count.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400">
                Total Products
              </span>
              <span className="text-2xl font-black text-gray-900">
                {market.products_count.toLocaleString()}+
              </span>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 transition-colors hover:bg-gray-100">
            <span className="text-sm font-semibold text-green-700">
              {buttonLabel}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-green-700" />
          </div>
        </div>
      </div>
    </Link>
  )
}

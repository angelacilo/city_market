import Link from 'next/link'
import MarketCard from '@/components/public/MarketCard'
import type { MarketWithStats } from '@/types'

const HOME_MARKET_ORDER = [
  'Agora Market',
  'Libertad Public Market',
  'Cogon Market',
  'Robinsons Wet Market',
  'Divisoria Market',
  'Pili Market',
]

function orderMarketsForHome(markets: MarketWithStats[]): MarketWithStats[] {
  const byName = new Map(markets.map((m) => [m.name, m]))
  const ordered: MarketWithStats[] = []
  for (const name of HOME_MARKET_ORDER) {
    const m = byName.get(name)
    if (m) ordered.push(m)
  }
  for (const m of markets) {
    if (!ordered.find((o) => o.id === m.id)) ordered.push(m)
  }
  return ordered.slice(0, 6)
}

export default function MarketsSection({
  markets,
  showAllHref,
  showAllLabel,
}: {
  markets: MarketWithStats[]
  showAllHref: string
  showAllLabel: string
}) {
  const ordered = orderMarketsForHome(markets)

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-gray-900">
            <span className="block text-3xl font-normal font-sans">Explore Local</span>
            <span className="block text-3xl font-bold font-serif">Markets</span>
          </h2>
          <p className="mt-3 text-sm text-gray-500 max-w-xl mx-auto">
            Compare prices and availability across Butuan&apos;s major public and commercial trading hubs.
          </p>
        </div>

        {ordered.length === 0 ? (
          <p className="mt-12 text-center text-sm text-gray-500">No markets available yet.</p>
        ) : (
          <>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {ordered.map((market, index) => (
                <MarketCard key={market.id} market={market} index={index} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href={showAllHref}
                className="text-sm font-medium text-green-700 hover:text-green-800"
              >
                {showAllLabel}
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

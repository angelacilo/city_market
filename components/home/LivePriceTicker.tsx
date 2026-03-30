'use client'

export type TickerItem = {
  id: string
  name: string
  unit: string
  price: number
  changePct: number | null
}

function formatPrice(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function LivePriceTicker({ items }: { items: TickerItem[] }) {
  const display = items.length > 0 ? items : []

  return (
    <div className="h-11 flex items-stretch overflow-hidden border-b border-gray-100 bg-white">
      <div className="flex items-center gap-2 border-r border-gray-200 pr-4 pl-4 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-xs font-bold text-gray-900 tracking-widest uppercase">Live prices</span>
      </div>
      <div className="ticker-scroll flex flex-1 items-center gap-0 overflow-x-auto px-2">
        {display.length === 0 ? (
          <span className="text-xs text-gray-400 px-2">No live listings yet.</span>
        ) : (
          display.map((item, i) => (
            <div key={item.id} className="flex items-center shrink-0">
              {i > 0 && <div className="mx-3 h-4 w-px bg-gray-200" aria-hidden />}
              <div className="flex items-center gap-3 px-2 py-2 whitespace-nowrap">
                <span className="text-xs text-gray-500 uppercase">{item.name}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatPrice(item.price)}/{item.unit}
                </span>
                {item.changePct === null ? (
                  <span className="text-xs text-gray-400">+0%</span>
                ) : item.changePct > 0 ? (
                  <span className="text-xs text-green-600">+{item.changePct.toFixed(1)}%</span>
                ) : item.changePct < 0 ? (
                  <span className="text-xs text-red-600">{item.changePct.toFixed(1)}%</span>
                ) : (
                  <span className="text-xs text-gray-400">+0%</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

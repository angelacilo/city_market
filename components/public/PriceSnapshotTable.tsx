import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { PriceSnapshot } from '@/types'
import { cn } from '@/lib/utils'

interface PriceSnapshotTableProps {
  listings: PriceSnapshot[]
}

export default function PriceSnapshotTable({ listings }: PriceSnapshotTableProps) {
  if (!listings || listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-8 py-16 text-center">
        <p className="text-sm font-sans text-gray-500">Price data will appear as vendors list products.</p>
      </div>
    )
  }

  const prices = listings.map((s) => s.price)
  const minPrice = Math.min(...prices)

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Sorted by lowest price
        </p>
        <span className="text-xs text-gray-400 font-sans">{listings.length} listings</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="px-6 py-3 text-xs font-medium text-gray-500">Product</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500">Vendor</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Price</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Market</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((item) => {
              const isMin = item.price === minPrice
              return (
                <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-green-50/20">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900 font-sans">{item.products?.name}</p>
                    <p className="text-xs text-gray-400 font-sans">Per {item.products?.unit || 'unit'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-800 font-sans">{item.vendors?.business_name}</p>
                    <p className="text-xs text-gray-400">
                      Stall {item.vendors?.stall_number || '—'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={cn(
                        'font-serif text-lg italic text-gray-900',
                        isMin && 'text-green-700'
                      )}
                    >
                      ₱{item.price.toFixed(2)}
                    </span>
                    {isMin && (
                      <span className="ml-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-sans font-medium text-green-800">
                        Best
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600 font-sans">
                    {item.markets?.name}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-3 text-center">
        <Link
          href="/compare"
          className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800"
        >
          Compare across all markets
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

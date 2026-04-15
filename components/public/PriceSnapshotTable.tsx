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
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-8 py-16 text-center transition-colors">
        <p className="text-sm font-sans text-gray-500 dark:text-gray-400">Price data will appear as vendors list products.</p>
      </div>
    )
  }

  const prices = listings.map((s) => s.price)
  const minPrice = Math.min(...prices)

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#0a0f0a] shadow-sm dark:shadow-[0_0_40px_-10px_rgba(34,197,94,0.1)] transition-all duration-500">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 px-6 py-4 bg-white dark:bg-white/[0.02]">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
          Sorted by lowest price
        </p>
        <span className="text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest">{listings.length} listings</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/80 dark:bg-white/5">
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Product</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Vendor</th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Price</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Market</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((item) => {
              const isMin = item.price === minPrice
              return (
                <tr key={item.id} className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-green-50/20 dark:hover:bg-green-500/5 transition-colors">
                  <td className="px-6 py-5">
                    <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.products?.name}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Per {item.products?.unit || 'unit'}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{item.vendors?.business_name}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                      Stall {item.vendors?.stall_number || '—'}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span
                      className={cn(
                        'font-serif italic text-xl font-black text-gray-900 dark:text-white',
                        isMin && 'text-green-700 dark:text-green-500'
                      )}
                    >
                      ₱{item.price.toFixed(2)}
                    </span>
                    {isMin && (
                      <span className="ml-3 inline-block rounded-lg bg-green-100 dark:bg-green-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-green-700 dark:text-green-500 shadow-sm shadow-green-200/50">
                        Best
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest">
                    {item.markets?.name}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] px-6 py-4 text-center">
        <Link
          href="/compare"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1b6b3e] dark:text-green-500 hover:text-green-800 dark:hover:text-green-400 transition-colors"
        >
          Compare across all markets
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

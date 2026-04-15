'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { CalendarDays } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface PriceTrendChartProps {
  productId: string
}

interface ChartDataPoint {
  date: string
  [market: string]: string | number
}

const MARKET_COLORS = [
  '#16a34a',
  '#2563eb',
  '#dc2626',
  '#d97706',
  '#7c3aed',
  '#0e7490',
]

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

export default function PriceTrendChart({ productId }: PriceTrendChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [marketNames, setMarketNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) return

    const supabase = createClient()
    setLoading(true)

    async function loadHistory() {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // First get listing ids for this product
      const { data: listings } = await supabase
        .from('price_listings')
        .select('id, market_id, markets ( id, name )')
        .eq('product_id', productId)

      if (!listings || listings.length === 0) {
        setChartData([])
        setMarketNames([])
        setLoading(false)
        return
      }

      const listingIds = listings.map((l: any) => l.id)

      // Build a map of listingId -> marketName
      const listingMarketMap: Record<string, string> = {}
      listings.forEach((l: any) => {
        if (l.markets?.name) {
          listingMarketMap[l.id] = l.markets.name
        }
      })

      const { data: history, error: historyError } = await supabase
        .from('price_history')
        .select('listing_id, price, recorded_at')
        .in('listing_id', listingIds)
        .gte('recorded_at', thirtyDaysAgo.toISOString())
        .order('recorded_at', { ascending: true })

      if (historyError || !history || history.length === 0) {
        if (historyError) {
          console.warn('[PRICE_HISTORY_FETCH]', historyError.message)
        }
        setChartData([])
        setMarketNames([])
        setLoading(false)
        return
      }

      // Transform into chart format
      const dateMap: Record<string, Record<string, number>> = {}
      const marketsSet = new Set<string>()

      history.forEach((h: any) => {
        const date = formatShortDate(h.recorded_at)
        const market = listingMarketMap[h.listing_id]
        if (!market) return
        marketsSet.add(market)
        if (!dateMap[date]) dateMap[date] = {}
        // Average if multiple listings from same market on same date
        if (dateMap[date][market]) {
          dateMap[date][market] = (dateMap[date][market] + h.price) / 2
        } else {
          dateMap[date][market] = h.price
        }
      })

      const uniqueMarkets = Array.from(marketsSet)
      const points: ChartDataPoint[] = Object.entries(dateMap).map(([date, prices]) => ({
        date,
        ...prices,
      }))

      setMarketNames(uniqueMarkets)
      setChartData(points)
      setLoading(false)
    }

    loadHistory()
  }, [productId])

  if (loading) {
    return (
      <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-48 rounded" />
        </div>
        <Skeleton className="h-4 w-72 rounded mb-6" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
    )
  }

  const hasEnoughData = chartData.length >= 2

  return (
    <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays className="w-4 h-4 text-green-600" />
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
          Price history — last 30 days
        </h3>
      </div>
      <p className="text-xs text-gray-400 font-medium mb-6">
        Track how prices have changed across markets over the past month.
      </p>

      {!hasEnoughData ? (
        <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
          <CalendarDays className="w-8 h-8 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-400">Not enough price history yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Check back after vendors have updated their prices a few times.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₱${v}`}
              width={52}
            />
            <Tooltip
              formatter={(value: any, name: any) => [`₱${Number(value).toFixed(2)}`, name] as any}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingBottom: '8px' }}
              verticalAlign="top"
            />
            {marketNames.map((market, idx) => (
              <Line
                key={market}
                type="monotone"
                dataKey={market}
                stroke={MARKET_COLORS[idx % MARKET_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 2 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

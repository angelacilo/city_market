'use client'

import { useState, useEffect } from 'react'
import { getAboutStats } from '@/lib/actions/stats'

export default function StatsSection() {
  const [stats, setStats] = useState({ vendors: 0, markets: 0, visitors: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const data = await getAboutStats()
      setStats(data)
      setLoading(false)
    }
    loadStats()
    
    // Refresh every minute for "real-time" feel
    const interval = setInterval(loadStats, 60000)
    return () => clearInterval(interval)
  }, [])

  const displayVendors = stats.vendors > 0 ? `${stats.vendors}` : '400+'
  const displayMarkets = stats.markets > 0 ? `${stats.markets}` : '6'
  const displayVisitors = stats.visitors > 0 ? `${(stats.visitors / 1000).toFixed(1)}k+` : '15k+'

  return (
    <section className="py-24 border-b border-gray-100 dark:border-white/5">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid md:grid-cols-3 gap-16 text-center">
          <div className="space-y-2 group">
            <div className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter transition-all group-hover:scale-110 duration-500">
              {loading ? (
                <span className="opacity-20 animate-pulse">---</span>
              ) : displayVendors}
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-green-700 dark:text-green-500">Verified Vendors</div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest pt-2">Across all participating districts</p>
          </div>
          <div className="space-y-2 group">
            <div className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter transition-all group-hover:scale-110 duration-500">
              {loading ? (
                <span className="opacity-20 animate-pulse">---</span>
              ) : displayMarkets}
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-green-700 dark:text-green-500">Public Markets</div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest pt-2">Integrated digital monitoring</p>
          </div>
          <div className="space-y-2 group">
            <div className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter transition-all group-hover:scale-110 duration-500">
              {loading ? (
                <span className="opacity-20 animate-pulse">---</span>
              ) : displayVisitors}
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-green-700 dark:text-green-500">Weekly Visitors</div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest pt-2">Active digital engagement</p>
          </div>
        </div>
      </div>
    </section>
  )
}

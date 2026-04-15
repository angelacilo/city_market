'use client'
 
import { useState } from 'react'
import NextImage from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle, Search, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
 
interface HeroProps {
  popularTags?: string[]
  tickerItems?: { name: string; price: number; unit: string; change: number | null }[]
  insight?: {
    type: 'down' | 'up'
    product: string
    change: string
    reason: string
  }
}
 
export default function Hero({ 
  popularTags = ["Well-milled Rice", "Pork Belly", "Whole Chicken", "Red Onions"],
  tickerItems = [],
  insight
}: HeroProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <NextImage
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80"
          alt="Market Background"
          fill
          className="object-cover object-center scale-105"
          priority
        />
        <div className="absolute inset-0 bg-white/75 dark:bg-[#050a05]/80 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white dark:to-[#050a05]" />
</div>
 
      {/* Content Container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        {/* Verified Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-[#1b6b3e]/10 border border-[#1b6b3e]/20 px-4 py-1.5 shadow-sm">
          <CheckCircle className="h-4 w-4 text-[#1b6b3e]" />
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#1b6b3e]">
            Verified by Butuan City Government
          </span>
        </div>
 
        {/* Headline */}
        <h1 className="mb-6 text-6xl md:text-8xl font-black text-[#1a1a1a] dark:text-white tracking-tight leading-[1.1]">
          Find the <span className="font-serif italic font-medium text-[#1b6b3e] dark:text-green-500">best</span>
          <br />
          <span className="font-serif italic font-medium text-[#1b6b3e] dark:text-green-500">prices</span> in Butuan.
        </h1>
 
        {/* Tagline */}
        <p className="mb-12 text-lg md:text-xl font-medium text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
          Access real-time commodity tracking and vendor directory.<br />
          Empowering citizens with transparent market data.
        </p>
 
        {/* Functional Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-3xl relative group">
          <div className="absolute -inset-1.5 bg-green-600/10 dark:bg-green-500/5 rounded-[2.5rem] blur opacity-0 group-hover:opacity-100 transition duration-500" />
          <div className="relative flex items-center bg-white dark:bg-white/5 backdrop-blur-xl rounded-full p-2 shadow-2xl shadow-green-900/10 dark:shadow-green-500/5 border border-gray-100 dark:border-white/10 focus-within:ring-2 focus-within:ring-green-600/20 dark:focus-within:ring-green-500/20 transition-all">
             <div className="pl-6 pr-3 text-gray-400">
               <Search className="h-5 w-5" />
             </div>
             <input 
                type="text" 
                placeholder="Search for 'Rice', 'Pork', 'Chicken'..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-white font-medium placeholder:text-gray-400 py-4"
             />
             <button 
               type="submit"
               className="bg-[#007e41] hover:bg-[#006b37] dark:bg-[#1b6b3e] dark:hover:bg-[#155331] text-white rounded-full px-8 py-4 flex items-center gap-2 font-bold transition-all shadow-lg shadow-green-900/20 dark:shadow-green-500/10 active:scale-95"
             >
                <span>Search</span>
                <ArrowRight className="h-4 w-4" />
             </button>
          </div>
        </form>
 
        {/* Popular Tags */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            POPULAR:
          </span>
          <div className="flex flex-wrap gap-4 items-center">
            {popularTags.map((tag) => (
              <Link 
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="text-xs font-black text-gray-900 dark:text-white hover:text-[#1b6b3e] dark:hover:text-green-500 transition-colors border-b-2 border-transparent hover:border-[#1b6b3e] dark:hover:border-green-500 pb-1"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </div>
 
      {/* ── Floating Insight Card ── */}
      {insight && (
        <div className="absolute hidden lg:block right-[5%] top-1/2 -translate-y-1/2 z-20 w-72 animate-bounce-slow">
           <div className="bg-white dark:bg-[#0a0f0a] rounded-3xl p-6 shadow-2xl dark:shadow-[0_0_50px_-10px_rgba(27,107,62,0.2)] border border-gray-100 dark:border-white/5 flex flex-col gap-3 group hover:-translate-y-2 transition-transform cursor-default">
             <div className="flex items-center gap-3">
               <div className={cn(
                 "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-inner",
                 insight.type === 'down' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
               )}>
                 {insight.type === 'down' ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
               </div>
               <div className="flex flex-col">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                   LIVE INSIGHT
                 </p>
                 <p className="text-base font-black text-gray-900 dark:text-white leading-none mt-0.5">
                   {insight.product} {insight.type === 'down' ? 'down' : 'up'} {insight.change}
                 </p>
               </div>
             </div>
             <p className="text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400">
               {insight.reason}
             </p>
             <div className="pt-1 flex items-center justify-between">
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => (
                      <div key={i} className="w-5 h-5 rounded-full bg-green-100 border border-white" />
                   ))}
                </div>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Live Updates</span>
             </div>
           </div>
        </div>
      )}
 
      {/* ── Live Prices Bar ─────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/80 dark:bg-[#0a0f0a]/80 backdrop-blur-md border-t border-gray-100 dark:border-white/5 py-3 overflow-hidden transition-colors">
        <div className="mx-auto max-w-7xl px-6 flex items-center gap-12 whitespace-nowrap overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Live Prices:</span>
          </div>
 
          <div className="flex items-center gap-12 animate-ticker">
            {tickerItems.length > 0 ? (
              <>
                {tickerItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase">{item.name}</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">₱{item.price.toFixed(2)} /{item.unit}</span>
                    {item.change !== null ? (
                      <div className={cn(
                        "flex items-center gap-0.5 text-[10px] font-black",
                        item.change > 0 ? "text-red-500" : item.change < 0 ? "text-green-600" : "text-gray-400"
                      )}>
                        {item.change > 0 ? <TrendingUp className="h-3 w-3" /> : item.change < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                        {item.change === 0 ? "STABLE" : `${Math.abs(item.change)}%`}
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-gray-400 uppercase">STABLE</span>
                    )}
                  </div>
                ))}
                {/* Clone for loop */}
                {tickerItems.map((item, idx) => (
                  <div key={`clone-${idx}`} className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase">{item.name}</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">₱{item.price.toFixed(2)} /{item.unit}</span>
                    {item.change !== null ? (
                      <div className={cn(
                        "flex items-center gap-0.5 text-[10px] font-black",
                        item.change > 0 ? "text-red-500" : item.change < 0 ? "text-green-600" : "text-gray-400"
                      )}>
                        {item.change > 0 ? <TrendingUp className="h-3 w-3" /> : item.change < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                        {item.change === 0 ? "STABLE" : `${Math.abs(item.change)}%`}
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-gray-400 uppercase">STABLE</span>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse">Initializing real-time market stream...</span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}



'use client'

import type { CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, TrendingDown } from 'lucide-react'
import SearchBar from '@/components/public/SearchBar'

const MARKET_GREEN = '#1a5c38'

export default function Hero() {
  return (
    <section
      className="relative flex flex-col md:flex-row md:h-[520px] w-full overflow-visible"
      style={{ '--hero-bg': MARKET_GREEN } as CSSProperties}
    >
      <div
        className="order-2 md:order-1 w-full md:w-[55%] flex-shrink-0 px-6 py-10 md:px-10 md:py-12 relative min-h-0"
        style={{ backgroundColor: MARKET_GREEN }}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-green-600/40 bg-green-700/30 px-3 py-1.5">
          <ShieldCheck className="w-3 h-3 text-green-300 shrink-0" aria-hidden />
          <span className="text-xs text-green-200 tracking-wide uppercase">
            Verified by Butuan City Government
          </span>
        </div>

        <h1 className="mt-8 text-white leading-tight">
          <span className="block text-4xl sm:text-5xl font-bold font-sans">Find the</span>
          <span className="block text-4xl sm:text-5xl font-bold italic font-serif">best prices</span>
          <span className="block text-4xl sm:text-5xl font-bold font-sans">in Butuan.</span>
        </h1>

        <div className="mt-8 max-w-xl">
          <SearchBar variant="hero" />
        </div>

        <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-green-300">
          <span>Popular:</span>
          {[
            { label: 'Sirandongtong Rice', q: 'Sirandongtong Rice' },
            { label: 'Pork Belly', q: 'Pork Belly' },
            { label: 'Tilapia', q: 'Tilapia' },
          ].map((t) => (
            <Link
              key={t.q}
              href={`/search?q=${encodeURIComponent(t.q)}`}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20 transition-colors"
            >
              {t.label}
            </Link>
          ))}
        </p>
      </div>

      <div className="order-1 md:order-2 relative w-full md:w-[45%] h-[240px] md:h-full flex-shrink-0 overflow-hidden md:static">
        <Image
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80"
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 45vw"
          priority
        />
      </div>

      <div className="hidden md:block pointer-events-none absolute bottom-8 right-0 md:right-[calc(45%-1rem)] z-20 w-[min(100%,20rem)]">
        <div className="pointer-events-auto rounded-xl border border-gray-100 bg-white p-3 shadow-lg flex gap-3 items-start">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50">
            <TrendingDown className="h-4 w-4 text-green-600" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900">Rice prices down 4%</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Supply from Agusan del Norte has increased this morning.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle, TrendingDown } from 'lucide-react'
import SearchBar from '@/components/public/SearchBar'

export default function Hero() {
  return (
    <section className="relative w-full overflow-visible bg-[#1f6e3c]">
      <div className="mx-auto flex min-h-[600px] flex-col md:min-h-[480px] md:flex-row">
        {/* ── Left Panel ──────────────────────────────────────── */}
        <div className="order-2 flex w-full flex-shrink-0 flex-col justify-center px-6 py-10 md:order-1 md:w-[55%] md:py-16 md:pl-16 md:pr-8">
          {/* Verified badge */}
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1">
            <CheckCircle className="h-3 w-3 shrink-0 text-green-300" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-200">
              Verified by Butuan City Government
            </span>
          </div>

          {/* Mixed-typography headline */}
          <h1 className="mb-8 text-4xl font-bold leading-tight text-white sm:text-5xl">
            <span className="font-sans font-bold text-white">Find the </span>
            <span className="font-serif font-bold italic text-white">best</span>
            <span className="block" aria-hidden />
            <span className="font-serif font-bold italic text-white">prices </span>
            <span className="font-sans font-bold text-white">in Butuan.</span>
          </h1>

          {/* Search bar */}
          <div className="max-w-md">
            <SearchBar variant="hero" />
          </div>

          {/* Popular tags */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-green-300">
              Popular:
            </span>
            {[
              { label: 'Sinandomeng Rice', q: 'Sinandomeng Rice' },
              { label: 'Pork Belly', q: 'Pork Belly' },
              { label: 'Tilapia', q: 'Tilapia' },
            ].map((t) => (
              <Link
                key={t.q}
                href={`/search?q=${encodeURIComponent(t.q)}`}
                className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs text-white transition-colors hover:bg-white/25"
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Right Panel ─────────────────────────────────────── */}
        <div className="relative order-1 flex w-full flex-shrink-0 items-center justify-center px-6 pb-10 pt-0 md:order-2 md:w-[45%] md:px-0 md:py-12 md:pr-12">
          {/* Floating image container */}
          <div className="rounded-3xl ring-4 ring-white/10">
            <div className="relative h-[260px] w-full overflow-hidden rounded-3xl border-2 border-white/20 sm:h-[320px] md:h-[320px] md:w-[380px]">
              <Image
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80"
                alt="Fresh colorful vegetables in a wooden crate"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 380px"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Notification Card ─────────────────────── */}
      <div className="pointer-events-none absolute bottom-6 right-0 z-20 w-64 md:right-8">
        <div className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-green-100 bg-green-50">
            <TrendingDown className="h-3.5 w-3.5 text-green-600" aria-hidden />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
              Live Insight
            </p>
            <p className="mt-0.5 text-sm font-bold text-gray-900">
              Rice prices down 4%
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
              Supply from Agusan del Norte has increased this morning.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

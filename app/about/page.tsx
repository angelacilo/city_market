import type { Metadata } from 'next'
import { Eye, TrendingUp, Users, Mail, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us - Butuan City Market Information System',
  description:
    'Learn about the Butuan City Market Information System, our mission to connect buyers and vendors, and our commitment to transparent market pricing in Butuan City, Agusan del Norte.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#050a05] transition-colors duration-500">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        {/* ── Page Hero ──────────────────────────────────────── */}
        <section className="pb-24 pt-32 text-center lg:pt-40">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#1b6b3e] dark:text-green-500 mb-6 px-4 py-1.5 bg-green-50 dark:bg-green-500/10 rounded-full inline-block">
            Our Story
          </p>
          <h1 className="mt-4 leading-[1.1]">
            <span className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white font-sans tracking-tight">
              About{' '}
            </span>
            <span className="text-5xl md:text-7xl font-black text-[#1b6b3e] dark:text-green-500 font-serif italic">
              Butuan Market IS
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg md:text-xl leading-relaxed text-gray-500 dark:text-gray-400 font-medium">
            The Butuan City Market Information System is an official digital
            initiative of the City Government of Butuan to bring transparency,
            accessibility, and real-time accuracy to market pricing across
            Agusan del Norte.
          </p>
        </section>

        {/* ── Mission Section ────────────────────────────────── */}
        <section className="mt-24 grid grid-cols-1 gap-16 md:grid-cols-2 items-center py-20 border-t border-gray-100 dark:border-white/5">
          <div>
            <div className="border-l-4 border-[#1b6b3e] dark:border-green-500 pl-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1b6b3e] dark:text-green-500">
                Our Mission
              </p>
            </div>
            <h2 className="mt-6 leading-none">
              <span className="block text-4xl font-black text-gray-900 dark:text-white font-sans tracking-tight mb-2">
                Empowering
              </span>
              <span className="block text-4xl font-black text-[#1b6b3e] dark:text-green-500 font-serif italic">
                every shopper
              </span>
            </h2>
          </div>
          <div className="space-y-6">
            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300 font-medium italic font-serif">
              "We believe every buyer deserves to know where the best prices are
              before they leave their home."
            </p>
            <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
              Butuan City Market Maintain a live, verified, and publicly accessible
              database of prices, supplies, and vendor information across all
              six public markets in Butuan City.
            </p>
          </div>
        </section>

        {/* ── Three Pillars ──────────────────────────────────── */}
        <section className="mt-32 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Pillar 1 */}
          <div className="rounded-[2.5rem] border border-gray-100 dark:border-white/5 bg-white dark:bg-[#0a0f0a] p-10 shadow-sm dark:shadow-[0_0_50px_-10px_rgba(27,107,62,0.1)] hover:-translate-y-2 transition-all duration-500 group">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-500/10 mb-8 group-hover:bg-[#1b6b3e] transition-colors">
              <Eye className="h-7 w-7 text-[#1b6b3e] dark:text-green-500 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white font-serif italic tracking-tight">
              Transparency
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400 font-medium">
              All prices, vendor information, and stock availability are
              publicly accessible without any account or registration required.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-[2.5rem] border border-gray-100 dark:border-white/5 bg-white dark:bg-[#0a0f0a] p-10 shadow-sm dark:shadow-[0_0_50px_-10px_rgba(27,107,62,0.1)] hover:-translate-y-2 transition-all duration-500 group">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 mb-8 group-hover:bg-blue-600 transition-colors">
              <TrendingUp className="h-7 w-7 text-blue-600 dark:text-blue-400 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white font-serif italic tracking-tight">
              Real-time
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400 font-medium">
              Vendors update their prices directly from their phones. Buyers
              always see current information, not outdated data.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-[2.5rem] border border-gray-100 dark:border-white/5 bg-white dark:bg-[#0a0f0a] p-10 shadow-sm dark:shadow-[0_0_50px_-10px_rgba(27,107,62,0.1)] hover:-translate-y-2 transition-all duration-500 group">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10 mb-8 group-hover:bg-amber-600 transition-colors">
              <Users className="h-7 w-7 text-amber-600 dark:text-amber-400 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white font-serif italic tracking-tight">
              Community
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400 font-medium">
              Built for Butuanons by Butuanons. Every vendor on this
              platform strengthens the local market economy.
            </p>
          </div>
        </section>

        {/* ── Six Markets ────────────────────────────────────── */}
        <section className="mt-40 text-center py-20 bg-gray-50/50 dark:bg-white/[0.02] rounded-[3rem] border border-gray-100 dark:border-white/5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-600 mb-6">
            Our Covered Markets
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white font-serif italic tracking-tight">
            Comprehensive City Coverage
          </h2>
          <div className="mt-12 flex flex-wrap justify-center gap-4 max-w-4xl mx-auto px-6">
            {[
              'Agora Market',
              'Cogon Market',
              'Divisoria Market',
              'Libertad Public Market',
              'Pili Market',
              'Robinsons Wet Market',
            ].map((name) => (
              <span
                key={name}
                className="inline-block rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#0a0f0a] px-8 py-4 text-sm font-black text-gray-900 dark:text-white shadow-sm hover:border-[#1b6b3e] dark:hover:border-green-500 transition-all uppercase tracking-tight"
              >
                {name}
              </span>
            ))}
          </div>
        </section>

        {/* ── Stats ───────────────────────────────────── */}
        <section className="mt-40 text-center pb-20">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white font-sans tracking-tight mb-6">
            Built with purpose
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-500 dark:text-gray-400 font-medium">
            This system was designed as a flagship e-governance project to
            address real information gaps in Butuan City&apos;s public market
            ecosystem.
          </p>
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
            <div className="rounded-3xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#0a0f0a] px-16 py-10 shadow-2xl dark:shadow-[0_0_60px_-15px_rgba(27,107,62,0.2)]">
              <p className="font-serif text-6xl font-black text-[#1b6b3e] dark:text-green-500 italic">
                6
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
                Markets covered
              </p>
            </div>
            <div className="rounded-3xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#0a0f0a] px-16 py-10 shadow-2xl dark:shadow-[0_0_60px_-15px_rgba(27,107,62,0.2)]">
              <p className="font-serif text-6xl font-black text-[#1b6b3e] dark:text-green-500 italic">
                Free
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
                For all buyers
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ── Contact CTA ──────────────────────────────────────── */}
      <section className="mx-auto mt-40 max-w-5xl px-6 sm:px-8 pb-40">
        <div className="rounded-[3.5rem] bg-[#1b6b3e] dark:bg-[#0a0f0a] p-16 text-center relative overflow-hidden shadow-2xl dark:shadow-[0_0_80px_-20px_rgba(34,197,94,0.3)] border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-green-300 dark:text-green-500/60 mb-6">
            Get In Touch
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-black text-white italic tracking-tight">
            Questions or concerns?
          </h2>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-green-100 dark:text-gray-400 font-medium">
            Reach out to the City Government of Butuan&apos;s Department of Trade and Market Operations.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-green-300 dark:text-green-500" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-white">trade@butuan.gov.ph</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-green-300 dark:text-green-500" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-white">
                Butuan City Hall Complex
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

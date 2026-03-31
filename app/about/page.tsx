import type { Metadata } from 'next'
import { Eye, TrendingUp, Users, Mail, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us - Butuan City Market Information System',
  description:
    'Learn about the Butuan City Market Information System, our mission to connect buyers and vendors, and our commitment to transparent market pricing in Butuan City, Agusan del Norte.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f0f7f0]">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        {/* ── Page Hero ──────────────────────────────────────── */}
        <section className="pb-16 pt-20 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-green-600">
            Our Story
          </p>
          <h1 className="mt-4">
            <span className="text-5xl font-black text-gray-900 font-sans">
              About{' '}
            </span>
            <span className="text-5xl font-black italic text-green-700 font-serif">
              Butuan Market IS
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500">
            The Butuan City Market Information System is an official digital
            initiative of the City Government of Butuan to bring transparency,
            accessibility, and real-time accuracy to market pricing across
            Agusan del Norte.
          </p>
        </section>

        {/* ── Separator ──────────────────────────────────────── */}
        <div className="mx-auto my-12 h-px max-w-xs bg-gray-200" />

        {/* ── Mission Section ────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <div className="border-l-4 border-green-600 pl-3">
              <p className="text-xs font-bold uppercase tracking-widest text-green-600">
                Our Mission
              </p>
            </div>
            <h2 className="mt-6">
              <span className="block text-3xl font-black text-gray-900 font-sans">
                Empowering
              </span>
              <span className="block text-3xl font-black italic text-green-700 font-serif">
                every shopper and vendor
              </span>
            </h2>
          </div>
          <div className="space-y-5">
            <p className="text-base leading-relaxed text-gray-600">
              We believe every buyer deserves to know where the best prices are
              before they leave their home. And every vendor deserves a platform
              to be discovered by thousands of daily shoppers. BCMIS bridges
              this gap by maintaining a live, verified, and publicly accessible
              database of prices, supplies, and vendor information across all
              six public markets in Butuan City.
            </p>
            <p className="text-base leading-relaxed text-gray-600">
              This system was developed as a flagship e-governance project to
              support local trade, reduce unnecessary travel, and promote price
              competitiveness among Butuan&apos;s market vendors.
            </p>
          </div>
        </section>

        {/* ── Three Pillars ──────────────────────────────────── */}
        <section className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Pillar 1 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100">
              <Eye className="h-6 w-6 text-green-700" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900">
              Transparency
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              All prices, vendor information, and stock availability are
              publicly accessible without any account or registration required.
              No hidden data, no paywalls.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
              <TrendingUp className="h-6 w-6 text-blue-700" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900">
              Real-time accuracy
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              Vendors update their prices directly from their phones. Buyers
              always see current information, not outdated data from last week
              or last month.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100">
              <Users className="h-6 w-6 text-amber-700" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900">
              Community-driven
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              Built for Butuanons by Butuanons. Every vendor who lists on this
              platform and every buyer who uses it strengthens the local market
              economy of Butuan City.
            </p>
          </div>
        </section>

        {/* ── Six Markets ────────────────────────────────────── */}
        <section className="mt-20 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Our Covered Markets
          </p>
          <h2 className="mt-3 text-2xl font-black text-gray-900">
            All 6 public markets in Butuan City
          </h2>
          <div className="mt-8 flex flex-wrap justify-center">
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
                className="m-1 inline-block rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </section>

        {/* ── Team / Stats ───────────────────────────────────── */}
        <section className="mt-20 text-center">
          <h2 className="text-2xl font-black text-gray-900">
            Built with purpose
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-500">
            This system was designed and developed as a capstone project to
            address real information gaps in Butuan City&apos;s public market
            ecosystem. It is maintained and updated regularly in partnership
            with the city&apos;s Department of Trade and Market Operations.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            <div className="rounded-2xl border border-gray-100 bg-white px-10 py-6 shadow-sm">
              <p className="font-serif text-4xl font-black text-green-700">
                6
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                Markets covered
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white px-10 py-6 shadow-sm">
              <p className="font-serif text-4xl font-black text-green-700">
                Free
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                For all buyers
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ── Contact CTA ──────────────────────────────────────── */}
      <section className="mx-auto mt-20 max-w-5xl px-6 sm:px-8">
        <div className="mb-12 rounded-3xl bg-[#1f6e3c] p-12 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-green-300">
            Get In Touch
          </p>
          <h2 className="mt-4 font-serif text-3xl font-black italic text-white">
            Questions or concerns?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-green-200">
            For inquiries about the system, vendor onboarding support, or data
            accuracy concerns, please reach out to the City Government of
            Butuan&apos;s Department of Trade and Market Operations.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-green-300" />
              <span className="text-sm text-white">trade@butuan.gov.ph</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-300" />
              <span className="text-sm text-white">
                Butuan City Hall, J.C. Aquino Avenue
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

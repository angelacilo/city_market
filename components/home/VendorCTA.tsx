import Image from 'next/image'
import Link from 'next/link'

const MARKET_GREEN = '#1a5c38'

export default function VendorCTA() {
  return (
    <section className="mx-6 mb-10 mt-4 md:mx-6">
      <div
        className="flex min-h-[320px] flex-col overflow-hidden rounded-3xl md:flex-row"
        style={{ backgroundColor: MARKET_GREEN }}
      >
        <div className="flex w-full flex-col justify-center p-10 sm:p-12 md:w-[55%]">
          <p className="text-xs uppercase tracking-widest text-green-300">Opportunities for locals.</p>
          <h2 className="mt-4 text-white">
            <span className="block text-3xl font-bold font-sans">Are you a</span>
            <span className="block text-3xl font-bold italic font-serif">local vendor?</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-green-200 max-w-md">
            Register your stall on the official Butuan Market Information System to increase your visibility
            and reach thousands of daily shoppers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-green-800 hover:bg-green-50 transition-colors"
            >
              Register your stall →
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-full border-2 border-white/40 px-5 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
        <div className="relative h-64 w-full overflow-hidden md:h-auto md:w-[45%] md:min-h-[320px]">
          <Image
            src="https://images.unsplash.com/photo-1588964895597-cfb1b3ebf378?w=600&q=80"
            alt="Vendor at a fresh produce stall"
            fill
            className="object-cover object-top scale-105 md:scale-110 md:-mb-4"
            sizes="(max-width: 768px) 100vw, 45vw"
          />
        </div>
      </div>
    </section>
  )
}

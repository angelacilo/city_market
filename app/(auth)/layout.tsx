import { ShoppingBasket, CheckCircle2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {

  const features = [
    'Reach buyers searching for your products online',
    'Update your prices anytime from your phone',
    'Get direct inquiries from interested buyers.',
  ]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f0f7f0]">
      {/* ── Left branding panel (desktop only) ──────────────────────── */}
      <div className="hidden lg:flex w-[45%] bg-white m-6 rounded-[3rem] shadow-sm border border-green-50 flex-col justify-center px-20 py-16 relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f0f7f0] rounded-full -mr-32 -mt-32 opacity-50 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-50 rounded-full -ml-48 -mb-48 opacity-30 blur-3xl" />
        
        <Link href="/" className="inline-flex items-center gap-3 mb-16 text-green-700 hover:text-green-800 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Back to Directory</span>
        </Link>

        {/* Logo */}
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-green-700 rounded-2xl flex items-center justify-center shadow-lg shadow-green-700/20">
            <ShoppingBasket className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-gray-900 font-serif italic font-black text-2xl leading-none">BCMIS</p>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Vendor Portal</p>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-black text-gray-900 leading-[1.1] mb-6 font-serif italic">
          Empowering Butuan&apos;s <span className="text-green-700 underline decoration-green-100 underline-offset-8">Local Markets.</span>
        </h1>

        <p className="text-gray-500 text-lg leading-relaxed mb-12 font-medium">
          Join a growing community of local vendors digitizing the Butuan market experience.
        </p>

        {/* Features list */}
        <div className="space-y-6">
          {features.map((f) => (
            <div key={f} className="flex items-start gap-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100/50 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                 <CheckCircle2 className="w-4 h-4 text-green-700" />
              </div>
              <span className="text-gray-700 text-sm font-bold leading-snug">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto min-h-screen">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-sm border border-gray-100/50 p-10 lg:p-14 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-green-700" />
            {children}
        </div>
      </div>
    </div>
  )
}

import { ShoppingBasket, CheckCircle2 } from 'lucide-react'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {

  const features = [
    'Reach buyers searching for your products online',
    'Update your prices anytime from your phone',
    'Get direct inquiries from interested buyers.',
  ]

  const stats = [
    { value: '6', label: 'Markets' },
    { value: '120+', label: 'Vendors' },
    { value: '50+', label: 'Products' },
  ]

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel (desktop only) ──────────────────────── */}
      <div
        className="hidden lg:flex w-2/5 bg-green-800 flex-col justify-center px-12 py-16 relative overflow-hidden flex-shrink-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 12px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <ShoppingBasket className="w-6 h-6 text-green-700" />
          </div>
          <div>
            <p className="text-white font-black text-base leading-tight">Butuan Market IS</p>
            <p className="text-green-300 text-xs font-medium">Butuan City, Agusan del Norte</p>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-black text-white leading-snug mb-4">
          The smarter way to shop in Butuan.
        </h1>

        <p className="text-green-200 text-sm leading-relaxed mb-8">
          Join hundreds of vendors already listing their products on the most complete market price
          information system in Butuan City, Agusan del Norte.
        </p>

        {/* Features */}
        <ul className="space-y-4 mb-12">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-white text-sm">{f}</span>
            </li>
          ))}
        </ul>

        {/* Stats row */}
        <div className="flex gap-8 border-t border-green-700 pt-8">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-green-400 text-xs font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────── */}
      <div className="flex-1 bg-white overflow-y-auto min-h-screen">
        <div className="max-w-md mx-auto px-6 py-12 sm:py-16 pb-20">
          {children}
        </div>
      </div>
    </div>
  )
}

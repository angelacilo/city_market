import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ShoppingBasket, CheckCircle2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const features = [
  'Reach buyers searching for your products online',
  'Update your prices anytime from your phone',
  'Get direct inquiries from interested buyers.',
]

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const { data: { session }, error } =
    await supabase.auth.getSession()

  if (error) {
    console.warn('[AUTH_LAYOUT] Session error:', error.message)
  }

  // Only redirect if session definitely exists AND user has a confirmed profile
  if (session?.user?.id) {
    const { data: vendorData } = await supabase
      .from('vendors')
      .select('id, is_approved')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (vendorData?.id) {
      redirect('/vendor/dashboard')
    }

    const { data: buyerData } = await supabase
      .from('buyer_profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (buyerData?.id) {
      redirect('/')
    }

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (adminData?.id) {
      redirect('/admin/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8faf8] dark:bg-[#0a0f0a] transition-colors duration-500">
      {/* ── Left branding panel (desktop only) ──────────────────────── */}
      <div className="hidden lg:flex w-[400px] xl:w-[500px] bg-white dark:bg-white/[0.02] m-6 rounded-[2.5rem] shadow-sm border border-green-50/50 dark:border-white/5 flex-col justify-center px-12 xl:px-16 py-16 relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-100/30 dark:bg-green-500/5 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-50 dark:bg-green-500/5 rounded-full -ml-48 -mb-48 opacity-30 blur-3xl" />
        
        <Link href="/" className="inline-flex items-center gap-3 mb-16 text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Directory</span>
        </Link>


        {/* Logo */}
        <div className="flex items-center gap-5 mb-12">
          <div className="w-14 h-14 bg-green-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-green-700/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
            <ShoppingBasket className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-gray-900 dark:text-white font-serif font-black text-2xl tracking-tight leading-none">Butuan City Market</p>
            <p className="text-gray-400 dark:text-gray-500 text-[9px] font-black uppercase tracking-[0.3em] mt-2">Vendor & Buyer Portal</p>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl xl:text-5xl font-black text-gray-900 dark:text-white leading-[1.1] mb-8 font-serif italic">
          Empowering Butuan&apos;s <span className="text-green-700 dark:text-green-500 underline decoration-green-100/50 dark:decoration-green-900/30 underline-offset-8">Local Trade.</span>
        </h1>

        <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-12 font-medium">
          Join the digital evolution of Butuan City&apos;s vibrant marketplace ecosystem.
        </p>


        {/* Features list */}
        <div className="space-y-4">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-4 p-4 bg-gray-50/50 dark:bg-white/[0.03] rounded-2xl border border-gray-100/50 dark:border-white/5 backdrop-blur-sm hover:translate-x-1 transition-transform">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm flex-shrink-0">
                 <CheckCircle2 className="w-4 h-4 text-green-700 dark:text-green-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300 text-[13px] font-bold leading-none tracking-tight">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel (Fully Expanded) ───────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto min-h-screen">
          {children}
      </div>

    </div>
  )
}

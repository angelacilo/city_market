import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Package, MessageSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Overview — Vendor Dashboard | Butuan City Market' }

export default async function VendorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, is_approved')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/register')

  const [
    { count: activeCount },
    { count: totalCount },
    { count: unreadCount },
  ] = await Promise.all([
    supabase
      .from('price_listings')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .eq('is_available', true),
    supabase
      .from('price_listings')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id),
    supabase
      .from('conversations')
      .select('vendor_unread_count', { count: 'exact' })
      .eq('vendor_id', vendor.id)
      .gt('vendor_unread_count', 0),
  ])

  const active = activeCount ?? 0
  const total = totalCount ?? 0
  const unread = unreadCount ?? 0
  const stockRate = total > 0 ? Math.round((active / total) * 100) : 0

  const now = new Date()
  const todayStr = now.toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-14 custom-scrollbar h-full">
      <div className="max-w-7xl mx-auto space-y-10">
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-[#1b6b3e] dark:bg-green-600 rounded-full" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1b6b3e] dark:text-green-500">Commercial Terminal</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight italic font-serif leading-tight">
              {vendor.business_name}
            </h1>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 max-w-lg mt-1 uppercase tracking-[0.2em]">{todayStr}</p>
          </div>

          {/* Stats Section */}
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            {/* Active Listings */}
            <div className="bg-white dark:bg-[#0a0f0a] rounded-[2rem] border border-gray-100 dark:border-white/5 px-8 py-6 shadow-sm flex-1 min-w-[160px] transition-all hover:scale-[1.02] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1b6b3e] dark:bg-green-600 opacity-20" />
              <div className="text-4xl lg:text-5xl font-black text-[#1b6b3e] dark:text-green-500 font-serif italic mb-1">
                {active}
              </div>
              <div className="text-[9px] font-black tracking-[0.2em] text-gray-400 dark:text-gray-600 uppercase mt-2">
                Active Inventory
              </div>
            </div>

            {/* Unread Inquiries */}
            <div className="bg-white dark:bg-[#0a0f0a] rounded-[2rem] border border-gray-100 dark:border-white/5 px-8 py-6 shadow-sm flex-1 min-w-[160px] transition-all hover:scale-[1.02] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 dark:bg-blue-500 opacity-20" />
              <div className="text-4xl lg:text-5xl font-black text-blue-600 dark:text-blue-500 font-serif italic mb-1">
                {unread}
              </div>
              <div className="text-[9px] font-black tracking-[0.2em] text-gray-400 dark:text-gray-600 uppercase mt-2">
                New Transmissions
              </div>
            </div>

            {/* Stock Rate */}
            <div className="bg-white dark:bg-[#111111]/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 dark:border-white/5 px-8 py-6 shadow-sm flex-1 min-w-[160px] transition-all hover:scale-[1.02]">
              <div className="text-4xl lg:text-5xl font-black text-[#1b6b3e] dark:text-green-500 font-serif italic">
                {stockRate}%
              </div>
              <div className="text-[9px] font-black tracking-[0.2em] text-gray-400 dark:text-gray-600 uppercase mt-2">
                Fill Rate
              </div>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS OR SHORTCUTS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/vendor/products" className="group">
            <Card className="bg-white dark:bg-white/[0.03] border-gray-100 dark:border-white/5 shadow-sm hover:border-[#1b6b3e]/30 hover:shadow-2xl hover:shadow-green-900/5 transition-all duration-500 rounded-[1.5rem] overflow-hidden cursor-pointer active:scale-95">
              <CardContent className="p-8 flex flex-col items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-[#1b6b3e]/5 dark:bg-green-500/10 flex items-center justify-center group-hover:bg-[#1b6b3e] transition-all duration-500 group-hover:rotate-6">
                  <Package className="w-6 h-6 text-[#1b6b3e] dark:text-green-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white italic font-serif">Catalog Management</h3>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1 group-hover:text-[#1b6b3e] transition-colors">Digital Storefront Control</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/vendor/prices" className="group">
            <Card className="bg-white dark:bg-white/[0.03] border-gray-100 dark:border-white/5 shadow-sm hover:border-[#1b6b3e]/30 hover:shadow-2xl hover:shadow-green-900/5 transition-all duration-500 rounded-[2rem] overflow-hidden cursor-pointer active:scale-95">
              <CardContent className="p-10 flex flex-col items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#1b6b3e]/5 dark:bg-green-500/10 flex items-center justify-center group-hover:bg-[#1b6b3e] transition-all duration-500 group-hover:rotate-6">
                  <TrendingUp className="w-8 h-8 text-[#1b6b3e] dark:text-green-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white italic font-serif">Market Index</h3>
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2 group-hover:text-[#1b6b3e] transition-colors">Daily Price Propagation</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/vendor/inquiries" className="group">
            <Card className="bg-white dark:bg-white/[0.03] border-gray-100 dark:border-white/5 shadow-sm hover:border-blue-600/30 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 rounded-[2rem] overflow-hidden cursor-pointer active:scale-95">
              <CardContent className="p-10 flex flex-col items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-600 transition-all duration-500 group-hover:rotate-6">
                  <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white italic font-serif">Transmission Hub</h3>
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2 group-hover:text-blue-600 transition-colors">Direct Buyer Feedback</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* HELP SECTION */}
        <section className="bg-white/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-12 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 font-serif italic">Getting Started</h3>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            Welcome to your new vendor dashboard. From here you can manage all your market listings, 
            update prices in real-time, and chat with potential buyers. Keep your stock information 
            accurate to maintain your verified vendor status. Direct inquiries will appear in your 
            transmission hub as buyers initiate procurement signals.
          </p>
        </section>
      </div>
    </div>
  )
}

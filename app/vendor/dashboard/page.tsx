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
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-14 custom-scrollbar h-full bg-white dark:bg-[#050a05] transition-colors duration-500">
      <div className="max-w-7xl mx-auto space-y-12">
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#1b6b3e] dark:bg-green-600 rounded-full shadow-[0_0_15px_rgba(27,107,62,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1b6b3e] dark:text-green-500">Commercial Terminal</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight italic font-serif leading-none">
              {vendor.business_name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
               <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{todayStr}</p>
               <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
               <span className="text-[10px] font-black text-[#1b6b3e] dark:text-green-500 tracking-widest uppercase">Operational Status: Online</span>
            </div>
          </div>

          {/* Stats Section */}
          <div className="flex flex-wrap gap-5 w-full lg:w-auto">
            {/* Active Listings */}
            <div className="bg-white dark:bg-[#0a0f0a] rounded-[2.5rem] border border-gray-100 dark:border-white/5 px-10 py-8 shadow-sm dark:shadow-[0_0_40px_rgba(27,107,62,0.1)] flex-1 min-w-[180px] transition-all hover:scale-[1.02] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1b6b3e] dark:bg-green-600 opacity-20" />
              <div className="text-5xl lg:text-6xl font-black text-[#1b6b3e] dark:text-green-500 font-serif italic mb-1">
                {active}
              </div>
              <div className="text-[10px] font-black tracking-[0.3em] text-gray-400 dark:text-gray-600 uppercase mt-2">
                Active Inventory
              </div>
              <div className="absolute top-4 right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Package className="w-12 h-12 text-[#1b6b3e] dark:text-green-500" />
              </div>
            </div>

            {/* Unread Inquiries */}
            <div className="bg-white dark:bg-[#0a0f0a] rounded-[2.5rem] border border-gray-100 dark:border-white/5 px-10 py-8 shadow-sm dark:shadow-[0_0_40px_rgba(59,130,246,0.1)] flex-1 min-w-[180px] transition-all hover:scale-[1.02] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 dark:bg-blue-500 opacity-20" />
              <div className="text-5xl lg:text-6xl font-black text-blue-600 dark:text-blue-500 font-serif italic mb-1">
                {unread}
              </div>
              <div className="text-[10px] font-black tracking-[0.3em] text-gray-400 dark:text-gray-600 uppercase mt-2">
                New Signals
              </div>
              <div className="absolute top-4 right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <MessageSquare className="w-12 h-12 text-blue-600 dark:text-blue-500" />
              </div>
            </div>

            {/* Stock Rate */}
            <div className="bg-white dark:bg-[#0f140f] rounded-[2.5rem] border border-gray-100 dark:border-green-500/10 px-10 py-8 shadow-sm dark:shadow-[0_0_50px_rgba(27,107,62,0.15)] flex-1 min-w-[180px] transition-all hover:scale-[1.02] relative group">
              <div className="text-5xl lg:text-6xl font-black text-[#1b6b3e] dark:text-green-500 font-serif italic">
                {stockRate}%
              </div>
              <div className="text-[10px] font-black tracking-[0.3em] text-gray-400 dark:text-gray-600 uppercase mt-2">
                Supply Index
              </div>
              <div className="absolute top-4 right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp className="w-12 h-12 text-[#1b6b3e] dark:text-green-500" />
              </div>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS OR SHORTCUTS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link href="/vendor/products" className="group">
            <Card className="bg-white dark:bg-[#0a0f0a] border-gray-100 dark:border-white/5 shadow-sm hover:border-[#1b6b3e]/30 dark:hover:border-green-500/30 hover:shadow-2xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 transition-all duration-500 rounded-[2rem] overflow-hidden cursor-pointer active:scale-95 group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1b6b3e]/[0.02] to-transparent pointer-events-none" />
              <CardContent className="p-10 flex flex-col items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[#1b6b3e]/5 dark:bg-green-500/10 flex items-center justify-center group-hover:bg-[#1b6b3e] transition-all duration-500 group-hover:rotate-6 shadow-sm">
                  <Package className="w-7 h-7 text-[#1b6b3e] dark:text-green-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white italic font-serif">Catalog Management</h3>
                  <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2 group-hover:text-[#1b6b3e] dark:group-hover:text-green-500 transition-colors">Digital Storefront Control</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/vendor/prices" className="group">
            <Card className="bg-white dark:bg-[#0a0f0a] border-gray-100 dark:border-white/5 shadow-sm hover:border-[#1b6b3e]/30 dark:hover:border-green-500/30 hover:shadow-2xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 transition-all duration-500 rounded-[2rem] overflow-hidden cursor-pointer active:scale-95 group relative">
               <div className="absolute inset-0 bg-gradient-to-br from-[#1b6b3e]/[0.02] to-transparent pointer-events-none" />
              <CardContent className="p-10 flex flex-col items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[#1b6b3e]/5 dark:bg-green-500/10 flex items-center justify-center group-hover:bg-[#1b6b3e] transition-all duration-500 group-hover:rotate-6 shadow-sm">
                  <TrendingUp className="w-7 h-7 text-[#1b6b3e] dark:text-green-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white italic font-serif">Market Index</h3>
                  <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2 group-hover:text-[#1b6b3e] dark:group-hover:text-green-500 transition-colors">Daily Price Propagation</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/vendor/inquiries" className="group">
            <Card className="bg-white dark:bg-[#0a0f0a] border-gray-100 dark:border-white/5 shadow-sm hover:border-blue-600/30 dark:hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-900/5 dark:hover:shadow-blue-500/10 transition-all duration-500 rounded-[2rem] overflow-hidden cursor-pointer active:scale-95 group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.02] to-transparent pointer-events-none" />
              <CardContent className="p-10 flex flex-col items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-600 transition-all duration-500 group-hover:rotate-6 shadow-sm">
                  <MessageSquare className="w-7 h-7 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white italic font-serif">Transmission Hub</h3>
                  <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Direct Buyer Feedback</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* HELP SECTION */}
        <section className="bg-white dark:bg-[#0a0f0a] border border-gray-100 dark:border-white/5 rounded-[3rem] p-12 shadow-sm dark:shadow-[0_0_60px_rgba(27,107,62,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#1b6b3e]/[0.03] dark:bg-green-600/[0.05] rounded-full -mr-48 -mt-48 blur-3xl transition-transform group-hover:scale-110" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
             <div className="max-w-2xl">
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-6 font-serif italic leading-none">Command Execution <span className="text-[#1b6b3e] dark:text-green-500 underline decoration-green-500/20 underline-offset-[12px] decoration-4">Summary</span></h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                  Welcome to your operational terminal. Manage market listings, synchronize pricing in real-time, 
                  and maintain buyer-vendor communication channels. Accurate stock parameters are essential for 
                  network integrity. Signal unread transmissions in the hub to initiate procurement protocols.
                </p>
             </div>
             <div className="shrink-0 flex flex-col items-end gap-2">
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em]">Network Authority</span>
                <span className="text-lg font-black text-gray-900 dark:text-white italic font-serif uppercase tracking-tight">Verified <span className="text-[#1b6b3e] dark:text-green-500">Vendor</span></span>
             </div>
          </div>
        </section>
      </div>
    </div>
  )
}

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
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .eq('is_read', false),
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
    <div className="space-y-10">
      {/* VENDOR DASHBOARD HERO */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h2 className="text-2xl font-normal text-gray-600 font-sans leading-none">
            Welcome back,
          </h2>
          <h1 className="text-4xl font-black text-green-700 font-serif mt-1">
            {vendor.business_name}
          </h1>
          <p className="text-sm text-gray-500 mt-3 font-medium">
            {todayStr}
          </p>
        </div>

        {/* Stats Section */}
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          {/* Active Listings */}
          <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 shadow-sm flex-1 min-w-[160px]">
            <div className="text-4xl font-black text-green-700 font-serif">
              {active}
            </div>
            <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mt-1">
              ACTIVE LISTINGS
            </div>
          </div>

          {/* Unread Inquiries */}
          <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 shadow-sm flex-1 min-w-[160px]">
            <div className="text-4xl font-black text-green-700 font-serif">
              {unread}
            </div>
            <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mt-1">
              UNREAD INQUIRIES
            </div>
          </div>

          {/* Stock Rate */}
          <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 shadow-sm flex-1 min-w-[160px]">
            <div className="text-4xl font-black text-green-700 font-serif">
              {stockRate}%
            </div>
            <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mt-1">
              STOCK RATE
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS OR SHORTCUTS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/vendor/products" className="group">
          <Card className="border-gray-100 shadow-sm hover:border-green-200 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <Package className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Manage Products</h3>
                <p className="text-xs text-gray-500">Update your stall catalog</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/vendor/prices" className="group">
          <Card className="border-gray-100 shadow-sm hover:border-green-200 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <TrendingUp className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Update Prices</h3>
                <p className="text-xs text-gray-500">Modify daily market prices</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/vendor/inquiries" className="group">
          <Card className="border-gray-100 shadow-sm hover:border-green-200 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <MessageSquare className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">View Inquiries</h3>
                <p className="text-xs text-gray-500">Respond to buyer messages</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* HELP SECTION */}
      <section className="bg-white/50 border border-gray-100 rounded-2xl p-8 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-2 font-serif">Getting Started</h3>
        <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
          Welcome to your new vendor dashboard. From here you can manage all your market listings, 
          update prices in real-time, and chat with potential buyers. Keep your stock information 
          accurate to maintain your verified vendor status.
        </p>
      </section>
    </div>
  )
}

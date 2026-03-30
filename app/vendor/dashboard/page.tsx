import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Package,
  MessageSquare,
  TrendingUp,
  BarChart2,
} from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Overview — Vendor Dashboard | BCMIS' }

function getGreeting(nowPHT: Date): string {
  const h = nowPHT.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'yesterday'
  return `${d}d ago`
}

export default async function VendorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, is_approved, markets(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!vendor) redirect('/register')

  if (!vendor.is_approved) {
    // Auto-approve newly created vendors to bypass admin dashboard requirement for MVP
    await supabase.from('vendors').update({ is_approved: true }).eq('id', vendor.id)
    vendor.is_approved = true
  }

  const [
    { count: activeCount },
    { count: totalCount },
    { count: unreadCount },
    { data: recentListings },
    { data: recentInquiries },
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
    supabase
      .from('price_listings')
      .select('id, price, is_available, last_updated, products(name, unit)')
      .eq('vendor_id', vendor.id)
      .order('last_updated', { ascending: false })
      .limit(5),
    supabase
      .from('inquiries')
      .select('id, buyer_name, message, created_at, is_read, price_listings(products(name))')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const active = activeCount ?? 0
  const total = totalCount ?? 0
  const unread = unreadCount ?? 0
  const stockRate = total > 0 ? Math.round((active / total) * 100) : 0

  // Philippine Standard Time offset = UTC+8
  const nowPHT = new Date(Date.now() + 8 * 60 * 60 * 1000)
  const greeting = getGreeting(nowPHT)
  const todayStr = nowPHT.toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Asia/Manila',
  })

  const stats = [
    {
      label: 'Active listings',
      value: active,
      icon: Package,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
    },
    {
      label: 'Total listings',
      value: total,
      icon: Package,
      iconColor: 'text-gray-500',
      iconBg: 'bg-gray-50',
    },
    {
      label: 'Unread inquiries',
      value: unread,
      icon: MessageSquare,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50',
      pulse: unread > 0,
    },
    {
      label: 'Stock rate',
      value: `${stockRate}%`,
      icon: TrendingUp,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Greeting ──────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{todayStr}</p>
        <h1 className="text-2xl font-black text-gray-900">
          {greeting},{' '}
          <span className="text-green-600">{vendor.business_name}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here&apos;s what&apos;s happening with your stall today.
        </p>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                  <s.icon className={`w-4 h-4 ${s.iconColor}`} />
                </div>
                {s.pulse && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                )}
              </div>
              <p className="text-2xl font-black text-gray-900 tabular-nums">{s.value}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Two-column panels ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Recent listings */}
        <Card className="lg:col-span-3 border-gray-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between py-4 px-5 border-b border-gray-50">
            <p className="font-black text-sm text-gray-900">Recent listings</p>
            <Link href="/vendor/products" className="text-xs font-bold text-green-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {!recentListings || recentListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Package className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm font-bold text-gray-500 mb-1">No listings yet</p>
                <p className="text-xs text-gray-400 mb-4">Start by adding your first product listing</p>
                <Link
                  href="/vendor/products"
                  className="h-11 px-5 inline-flex items-center bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Add your first listing
                </Link>
              </div>
            ) : (
              <div>
                {recentListings.map((listing: any, idx: number) => (
                  <div key={listing.id}>
                    <Link href="/vendor/products" className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-all">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {listing.products?.name ?? '—'}
                        </p>
                        <p className="text-xs text-gray-400">{listing.products?.unit ?? ''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-black text-green-700">
                          ₱{Number(listing.price).toFixed(2)}
                        </p>
                        {listing.is_available ? (
                          <Badge className="bg-green-100 text-green-700 border-0 text-[10px] font-bold">In stock</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-500 border-red-200 text-[10px] font-bold">Out of stock</Badge>
                        )}
                      </div>
                    </Link>
                    {idx < recentListings.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent inquiries */}
        <Card className="lg:col-span-2 border-gray-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between py-4 px-5 border-b border-gray-50">
            <p className="font-black text-sm text-gray-900">Recent inquiries</p>
            <Link href="/vendor/inquiries" className="text-xs font-bold text-green-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {!recentInquiries || recentInquiries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-400">
                  No inquiries yet. Buyers will contact you here when they are interested in your products.
                </p>
              </div>
            ) : (
              <div>
                {recentInquiries.map((inq: any, idx: number) => {
                  const initials = (inq.buyer_name as string).charAt(0).toUpperCase()
                  const productName = inq.price_listings?.products?.name ?? 'Product'
                  const preview = inq.message.length > 60
                    ? inq.message.slice(0, 60) + '…'
                    : inq.message

                  return (
                    <div key={inq.id}>
                      <Link
                        href="/vendor/inquiries"
                        className={`flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-all ${!inq.is_read ? 'bg-blue-50/60' : ''}`}
                      >
                        {!inq.is_read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        )}
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-black text-gray-600">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm truncate ${!inq.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {inq.buyer_name}
                          </p>
                          <p className="text-xs text-green-600 font-medium truncate">{productName}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{preview}</p>
                        </div>
                        <p className="text-xs text-gray-400 flex-shrink-0">{relativeTime(inq.created_at)}</p>
                      </Link>
                      {idx < recentInquiries.length - 1 && <Separator />}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

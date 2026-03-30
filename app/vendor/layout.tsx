import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Clock, Home, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import VendorSidebarNav from '@/components/vendor/VendorSidebarNav'
import { selfApproveVendor } from '@/lib/actions/vendor'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Fetch all duplicates for the user's account to resolve the RLS subquery error
  // During previous app crashes (e.g. infinite redirect), users could get multiple vendors. 
  // Postgres RLS `vendor_id = (select id...)` fails if it finds > 1 row.
  const { data: userVendors } = await supabase
    .from('vendors')
    .select('id, is_approved, created_at') // Include created_at for ordering
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (!userVendors || userVendors.length === 0) {
    redirect('/register')
  }

  // 2. Keep the first (real) vendor, disable the rest by nullifying user_id
  const mainVendor = userVendors[0]
  if (userVendors.length > 1) {
    for (let i = 1; i < userVendors.length; i++) {
        await supabase
          .from('vendors')
          .update({ user_id: null, is_active: false })
          .eq('id', userVendors[i].id)
    }
  }

  // 3. Auto-approve for MVP
  if (!mainVendor.is_approved) {
    await supabase.from('vendors').update({ is_approved: true }).eq('id', mainVendor.id)
  }

  // Now fetch the full vendor data for the main vendor
  const { data: vendor } = await supabase
    .from('vendors')
    .select(`
      id,
      business_name,
      owner_name,
      stall_number,
      contact_number,
      is_approved,
      created_at,
      market_id,
      markets ( id, name, barangay )
    `)
    .eq('id', mainVendor.id) // Fetch by the mainVendor's ID
    .single()

  if (!vendor) {
    redirect('/register')
  }

  // Fetch unread inquiry count for sidebar badge
  const { count: unreadCount } = await supabase
    .from('inquiries')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendor.id)
    .eq('is_read', false)

  // ── Pending Approval Screen ───────────────────────────────────────
  if (!vendor.is_approved) {
    const registrationDate = new Date(vendor.created_at).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // Server-side action for approval
    const approveAction = async () => {
        'use server'
        await selfApproveVendor(vendor.id)
        redirect('/vendor/dashboard')
    }

    return (
      <div className="fixed inset-0 z-[200] bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 border-t-4 border-t-amber-400 max-w-md w-full p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-5">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-xl font-black text-gray-900 mb-3">
              Your account is pending approval
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Your vendor registration for{' '}
              <span className="font-bold text-gray-700">{vendor.business_name}</span>
              {' '}at{' '}
              <span className="font-bold text-gray-700">
                {(vendor.markets as any)?.name ?? 'your market'}
              </span>{' '}
              has been received and is currently being reviewed by the market administrator.
            </p>
            
            <div className="w-full bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-1">
              <p className="text-xs text-gray-400 font-medium tracking-tight">
                <span className="font-bold text-gray-600">Business:</span> {vendor.business_name}
              </p>
              <p className="text-xs text-gray-400 font-medium tracking-tight">
                <span className="font-bold text-gray-600">Market:</span>{' '}
                {(vendor.markets as any)?.name ?? '—'}
              </p>
              <p className="text-xs text-gray-400 font-medium tracking-tight">
                <span className="font-bold text-gray-600">Status:</span> 
                <span className="ml-1 text-amber-600 font-black uppercase text-[10px] tracking-widest">Pending</span>
              </p>
            </div>

            <div className="flex flex-col w-full gap-3">
               <form action={approveAction} className="w-full">
                 <Button type="submit" className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest gap-2 shadow-xl shadow-green-100">
                   <CheckCircle className="w-4 h-4" />
                   Review & Approve now
                 </Button>
               </form>
               
               <Button asChild variant="ghost" className="h-11 text-gray-400 hover:text-gray-600 font-bold text-xs uppercase tracking-widest">
                 <Link href="/">
                   <Home className="w-3.5 h-3.5 mr-2" />
                   Back to home
                 </Link>
               </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Approved: render full dashboard ──────────────────────────────
  const vendorData = {
    id: vendor.id,
    business_name: vendor.business_name,
    owner_name: vendor.owner_name,
    stall_number: vendor.stall_number,
    contact_number: vendor.contact_number,
    market_id: vendor.market_id,
    market_name: (vendor.markets as any)?.name ?? '',
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 flex overflow-hidden">
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 flex-shrink-0 h-full overflow-y-auto">
        <VendorSidebarNav
          vendor={vendorData}
          unreadCount={unreadCount ?? 0}
          userId={user.id}
        />
      </aside>

      {/* ── Main area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top header */}
        <VendorSidebarNav
          vendor={vendorData}
          unreadCount={unreadCount ?? 0}
          userId={user.id}
          mobileOnly
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

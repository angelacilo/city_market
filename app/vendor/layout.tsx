import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import VendorSidebarNav from '@/components/vendor/VendorSidebarNav'
import VendorAccountDropdown from '@/components/vendor/VendorAccountDropdown'
import { selfApproveVendor } from '@/lib/actions/vendor'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch vendor data
  const { data: userVendors } = await supabase
    .from('vendors')
    .select('id, is_approved, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (!userVendors || userVendors.length === 0) {
    redirect('/register')
  }

  const mainVendor = userVendors[0]

  // Auto-approve for MVP
  if (!mainVendor.is_approved) {
    await supabase.from('vendors').update({ is_approved: true }).eq('id', mainVendor.id)
  }

  const { data: vendor } = await supabase
    .from('vendors')
    .select(`
      id,
      business_name,
      owner_name,
      stall_number,
      contact_number,
      is_approved,
      is_active,
      created_at,
      market_id,
      markets ( id, name, barangay )
    `)
    .eq('id', mainVendor.id)
    .single()

  if (!vendor) {
    redirect('/register')
  }

  // Fetch unread count for vendor sidebar
  const { data: convs } = await supabase
    .from('conversations')
    .select('vendor_unread_count')
    .eq('vendor_id', vendor.id)

  const unreadCount = convs?.reduce((acc: number, c: any) => acc + (c.vendor_unread_count || 0), 0) || 0

  const vendorInfo = {
    id: vendor.id,
    business_name: vendor.business_name,
    owner_name: vendor.owner_name,
    stall_number: vendor.stall_number,
    contact_number: vendor.contact_number,
    market_id: vendor.market_id,
    market_name: (vendor.markets as any)?.name || 'Market'
  }

  // ── Pending Approval Screen ───────────────────────────────────────
  if (!vendor.is_approved) {
    const approveAction = async () => {
      'use server'
      await selfApproveVendor(vendor.id)
      redirect('/vendor/dashboard')
    }

    return (
      <div className="fixed inset-0 z-[200] bg-white dark:bg-[#0a0f0a] flex items-center justify-center p-4 transition-colors">
        <div className="bg-white dark:bg-[#121212] rounded-[3rem] shadow-2xl border border-gray-100 dark:border-white/5 max-w-md w-full p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-amber-500" />
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/10 rounded-[2.5rem] flex items-center justify-center mb-10 border border-amber-100 dark:border-amber-900/20">
              <Clock className="w-10 h-10 text-amber-600 dark:text-amber-500" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white font-serif italic mb-4 leading-none tracking-tight">
              Pending <span className="text-amber-600 font-sans not-italic">Approval</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-12">
              Your application for <span className="font-bold text-gray-900 dark:text-white">{vendor.business_name}</span> is currently under manual review by the market administrator.
            </p>

            <div className="flex flex-col w-full gap-4">
              <form action={approveAction} className="w-full">
                <Button type="submit" className="w-full h-16 rounded-2xl bg-[#1b6b3e] hover:bg-[#155430] text-white py-6 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-green-900/10 transition-all active:scale-95">
                  Review & Approve Now
                </Button>
              </form>

              <Button asChild variant="ghost" className="h-14 rounded-2xl text-gray-400 dark:text-gray-500 hover:text-[#1b6b3e] dark:hover:text-green-500 text-[10px] font-black uppercase tracking-widest">
                <Link href="/">
                  Go back to store
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f7f0] dark:bg-[#080c08] flex h-screen overflow-hidden transition-colors duration-500">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-72 flex-col bg-white dark:bg-[#0a0f0a] border-r border-gray-100 dark:border-white/5 flex-shrink-0 transition-colors">
        <VendorSidebarNav vendor={vendorInfo} unreadCount={unreadCount} userId={user.id} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header + Desktop Top Bar */}
        <header className="h-16 bg-white dark:bg-[#0a0f0a] border-b border-gray-100 dark:border-white/5 flex items-center justify-between px-6 flex-shrink-0 z-10 transition-colors">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Trigger (handled inside VendorSidebarNav) */}
            <VendorSidebarNav vendor={vendorInfo} unreadCount={unreadCount} userId={user.id} mobileOnly />
            <h1 className="hidden lg:block text-2xl font-serif font-black italic text-[#1b6b3e] dark:text-green-500 tracking-tight">
              BUTUAN <span className="text-gray-300 dark:text-gray-800 font-sans not-italic text-sm ml-2">VERSION 1.0</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <VendorAccountDropdown vendor={vendor as any} />
          </div>
        </header>

        {/* Full-width content area for focused tools like Messenger */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  )
}

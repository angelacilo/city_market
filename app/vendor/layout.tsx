import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import VendorNavbar from '@/components/layout/VendorNavbar'
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
      created_at,
      market_id,
      markets ( id, name, barangay )
    `)
    .eq('id', mainVendor.id)
    .single()

  if (!vendor) {
    redirect('/register')
  }

  // ── Pending Approval Screen ───────────────────────────────────────
  if (!vendor.is_approved) {
    const approveAction = async () => {
        'use server'
        await selfApproveVendor(vendor.id)
        redirect('/vendor/dashboard')
    }

    return (
      <div className="fixed inset-0 z-[200] bg-[#f0f7f0] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full p-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-12 h-12 text-amber-600" />
            </div>
            <h1 className="text-3xl font-black text-amber-600 font-serif mb-4">
              Pending Approval
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              <span className="font-bold text-gray-700 block text-lg mb-1">{vendor.business_name}</span>
              at {(vendor.markets as any)?.name ?? 'your market'}
            </p>
            
            <div className="flex flex-col w-full gap-4">
               <form action={approveAction} className="w-full">
                  <Button type="submit" className="w-full rounded-full bg-green-700 hover:bg-green-800 text-white py-6 text-sm font-medium transition-colors">
                    Review & Approve Now
                  </Button>
               </form>
               
               <Button asChild variant="ghost" className="h-11 text-gray-500 hover:text-green-700 font-medium">
                 <Link href="/">
                   Back to Home
                 </Link>
               </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f7f0] flex flex-col">
      {/* Top Vendor Navbar */}
      <VendorNavbar businessName={vendor.business_name} />

      {/* Main Page Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  )
}

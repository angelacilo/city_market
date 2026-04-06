import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InquiriesManager from '@/components/vendor/InquiriesManager'
 
export default async function VendorInquiriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
 
  if (!user) redirect('/login')
 
  // Fetch vendor id
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, user_id')
    .eq('user_id', user.id)
    .single()
 
  if (!vendor) redirect('/login')
 
  // Initial fetch of conversations for the vendor
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      buyer_profiles:buyer_id(id, full_name, contact_number, barangay)
    `)
    .eq('vendor_id', vendor.id)
    .order('last_message_at', { ascending: false })
 
  return (
    <div className="min-h-screen bg-gray-50/30 p-6 md:p-10">
       <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col gap-2">
             <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#1b6b3e] rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1b6b3e]">Vendor Hub</span>
             </div>
             <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">Messages <span className="font-serif italic font-medium">& Inquiries</span></h1>
             <p className="text-sm font-medium text-gray-500 max-w-lg">Respond to buyer inquiries and manage your stall conversations in real-time.</p>
          </div>
 
          <InquiriesManager initialConversations={conversations || []} vendorId={vendor.id} />
       </div>
    </div>
  )
}

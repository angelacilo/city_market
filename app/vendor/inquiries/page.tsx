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
    <div className="h-full">
      <InquiriesManager initialConversations={conversations || []} vendorId={vendor.id} />
    </div>
  )
}

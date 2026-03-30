import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InquiriesManager from '@/components/vendor/InquiriesManager'

export const metadata = { title: 'Inquiries — Vendor Dashboard | BCMIS' }

export default async function VendorInquiriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, markets(name)')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/register')

  const { data: inquiries } = await supabase
    .from('inquiries')
    .select(`
      id, buyer_name, buyer_contact, message, created_at, is_read,
      listing_id,
      price_listings (
        id, price,
        products ( name, unit )
      )
    `)
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  return (
    <InquiriesManager
      inquiries={(inquiries as any[]) ?? []}
      marketName={(vendor.markets as any)?.name ?? ''}
    />
  )
}

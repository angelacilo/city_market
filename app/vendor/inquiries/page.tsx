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
    .order('last_message_at', { ascending: false })

  const unreadCount = inquiries?.filter(i => !i.is_read).length || 0

  return (
    <div className="space-y-8">
      <div>
        <span className="text-sm font-sans font-normal text-gray-500 uppercase tracking-wide block mb-1">
          Customer
        </span>
        <h1 className="text-4xl font-black italic text-green-700 font-serif leading-none">
          Inquiries
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
        </p>
      </div>

      <InquiriesManager
        inquiries={(inquiries as any[]) ?? []}
        marketName={(vendor.markets as any)?.name ?? ''}
      />
    </div>
  )
}

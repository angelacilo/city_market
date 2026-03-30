import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/vendor/ProfileForm'

export const metadata = { title: 'My Profile — Vendor Dashboard | BCMIS' }

export default async function VendorProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, owner_name, stall_number, contact_number, markets(name)')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/register')

  return (
    <ProfileForm
      vendorId={vendor.id}
      initialData={{
        business_name: vendor.business_name ?? '',
        owner_name: vendor.owner_name ?? '',
        stall_number: vendor.stall_number ?? '',
        contact_number: vendor.contact_number ?? '',
      }}
      marketName={(vendor.markets as any)?.name ?? '—'}
    />
  )
}

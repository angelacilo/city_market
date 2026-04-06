import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/vendor/ProfileForm'

export const metadata = { title: 'My Profile — Vendor Dashboard | Butuan City Market' }

export default async function VendorProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, owner_name, stall_number, contact_number, opening_time, closing_time, markets(name)')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/register')

  return (
    <div className="space-y-8">
      <div>
        <span className="text-sm font-sans font-normal text-gray-500 uppercase tracking-wide block mb-1">
          My
        </span>
        <h1 className="text-4xl font-black text-green-700 font-serif leading-none">
          Profile
        </h1>
        <p className="text-sm text-gray-400 mt-2 font-medium">
          {vendor.business_name}
        </p>
      </div>

      <ProfileForm
        vendorId={vendor.id}
        initialData={{
          business_name: vendor.business_name ?? '',
          owner_name: vendor.owner_name ?? '',
          stall_number: vendor.stall_number ?? '',
          contact_number: vendor.contact_number ?? '',
          opening_time: vendor.opening_time ?? '',
          closing_time: vendor.closing_time ?? '',
        }}
        marketName={(vendor.markets as any)?.name ?? '—'}
      />
    </div>
  )
}

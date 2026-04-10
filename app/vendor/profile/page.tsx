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
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-14 custom-scrollbar h-full">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-[#1b6b3e] dark:bg-green-600 rounded-full" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1b6b3e] dark:text-green-500">Identity Profile</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none italic font-serif uppercase">
            Commercial <span className="text-[#1b6b3e] dark:text-green-500 underline decoration-green-100 dark:decoration-green-900/30 underline-offset-8 decoration-8">Entity</span>
          </h1>
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 max-w-lg mt-1 uppercase tracking-widest">{vendor.business_name}</p>
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
    </div>
  )
}

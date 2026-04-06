import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BuyerProfileForm from '@/components/user/BuyerProfileForm'
 
export const metadata = { title: 'My Profile | Butuan City Market' }
 
export default async function BuyerProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
 
  const { data: profile } = await supabase
    .from('buyer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()
 
  return (
    <div className="container max-w-4xl mx-auto py-20 px-6">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
           <div className="w-1.5 h-6 bg-[#1b6b3e] rounded-full" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1b6b3e]">Account Settings</span>
        </div>
        <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none mb-4 italic font-serif">Personal <span className="text-[#1b6b3e]">Profile</span></h1>
        <p className="text-gray-400 font-medium">Manage your contact information and preferences for market communication.</p>
      </div>
 
      <BuyerProfileForm
        userId={user.id}
        initialData={{
          full_name: profile?.full_name ?? '',
          contact_number: profile?.contact_number ?? '',
          barangay: profile?.barangay ?? ''
        }}
      />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BuyerProfileManager from '@/components/user/BuyerProfileManager'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('buyer_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  if (!profile) {
    // If somehow a vendor/admin gets here, redirect them
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <BuyerProfileManager initialProfile={profile} userEmail={session.user.email ?? ''} />
    </div>
  )
}

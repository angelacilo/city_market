import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = {
  title: 'Vendor Registration — Butuan Market IS',
  description: 'Register your stall to start listing your products on the Butuan City Market Information System.',
}

export default async function RegisterPage() {
  const supabase = await createClient()

  // 1. Check auth and vendor status first
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (vendor) {
      // Already has a vendor profile, go to dashboard
      redirect('/vendor/dashboard')
    }
    // Else: let them stay on this page to complete their vendor profile!
  }

  // 2. Fetch Active Markets
  const { data: dbMarkets } = await supabase
    .from('markets')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  // Fallback for demonstration if DB is empty
  const fallbackMarkets = [
    { id: '1', name: 'Divisoria Market' },
    { id: '2', name: 'Pili Market' },
    { id: '3', name: 'Cogon Market' },
    { id: '4', name: 'Robinsons Wet Market' },
    { id: '5', name: 'Libertad Public Market' },
    { id: '6', name: 'Agora Market' }
  ]

  const markets = dbMarkets && dbMarkets.length > 0 ? dbMarkets : fallbackMarkets

  return <RegisterForm markets={markets} />
}

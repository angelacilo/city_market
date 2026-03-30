import LoginForm from '@/components/auth/LoginForm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Vendor Login — Butuan Market IS',
  description: 'Sign in to your vendor account to manage your product listings and respond to buyer inquiries.',
}

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (vendor) {
      redirect('/vendor/dashboard')
    }
  }

  return <LoginForm />
}


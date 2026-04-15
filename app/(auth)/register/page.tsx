import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import RegisterForm from '@/components/auth/RegisterForm'
 
export default async function RegisterPage() {
  const supabase = await createClient()
  
  // Fetch active markets for the vendor registration dropdown
  const { data: markets } = await supabase
    .from('markets')
    .select('id, name')
    .eq('is_active', true)
    .order('name')
 
  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <Suspense fallback={<div className="h-96 w-full max-w-2xl animate-pulse bg-gray-100 dark:bg-white/5 rounded-[3rem]" />}>
        <RegisterForm markets={markets || []} />
      </Suspense>
    </div>
  )
}

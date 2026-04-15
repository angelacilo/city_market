import { Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'
 
export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <Suspense fallback={<div className="h-96 w-full max-w-2xl animate-pulse bg-gray-100 dark:bg-white/5 rounded-[3rem]" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}


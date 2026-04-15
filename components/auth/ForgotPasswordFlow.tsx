'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import EmailStep from './steps/EmailStep'
import OtpStep from './steps/OtpStep'
import NewPasswordStep from './steps/NewPasswordStep'
import SuccessView from './steps/SuccessView'

type Step = 'email' | 'otp' | 'password' | 'success'

export default function ForgotPasswordFlow() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const supabase = createClient()

  useEffect(() => {
    // Check if redirected from a recovery link (standard Supabase behavior)
    const checkRecovery = async () => {
      // If we have a recovery type in the URL hash/param, go straight to password step
      const isRecovery = window.location.hash.includes('type=recovery') || 
                         window.location.search.includes('type=recovery')
      
      if (isRecovery) {
        setStep('password')
      }
    }
    checkRecovery()
  }, [])

  return (
    <div className="w-full max-w-[480px] mx-auto">
      <div className="bg-white dark:bg-[#0a0f0a] rounded-[3rem] p-8 lg:p-12 shadow-[0_20px_70px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_70px_-10px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/5 backdrop-blur-3xl relative overflow-hidden group">
        
        {/* Abstract background blobs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-100/20 dark:bg-green-500/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 transition-all duration-700 group-hover:scale-150" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-50/20 dark:bg-green-700/5 rounded-full -ml-16 -mb-16 blur-2xl opacity-30" />

        <div className="relative z-10">
          {step === 'email' && (
            <EmailStep 
              onSuccess={(e) => {
                setEmail(e)
                setStep('otp')
              }} 
            />
          )}
          {step === 'otp' && (
            <OtpStep 
              email={email}
              onSuccess={() => setStep('password')}
              onBack={() => setStep('email')}
            />
          )}
          {step === 'password' && (
            <NewPasswordStep 
              onSuccess={() => setStep('success')}
            />
          )}
          {step === 'success' && <SuccessView />}
        </div>
      </div>
    </div>
  )
}

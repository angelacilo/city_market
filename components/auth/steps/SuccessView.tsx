'use client'

import { CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SuccessView() {
  return (
    <div className="flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-700">
      <div className="w-20 h-20 rounded-[2.5rem] bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-[0_20px_40px_-10px_rgba(34,197,94,0.2)]">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>

      <div className="flex flex-col items-center">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mt-4 italic font-serif tracking-tighter uppercase leading-none">
          Success!
        </h1>
        <p className="text-[10px] font-black tracking-[0.4em] text-green-500 uppercase mt-4">
           Password Updated
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed mt-6 max-w-[280px] font-bold uppercase tracking-widest opacity-80">
          Your account has been secured with your new password. You can now sign in to access your dashboard.
        </p>
      </div>

      <div className="w-full pt-4">
        <Button
          asChild
          className="w-full h-16 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 group"
        >
          <Link href="/login" className="flex items-center justify-center gap-3">
             <span>Sign In Now</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </Button>
      </div>

      <p className="text-[9px] font-black text-gray-300 dark:text-gray-800 uppercase tracking-[0.2em] pt-4">
        Security Status: Verified & Secured
      </p>
    </div>
  )
}

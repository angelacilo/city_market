'use client'

import { CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SuccessView() {
  return (
    <div className="flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-700">
      <div className="w-20 h-20 rounded-3xl bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>

      <div className="flex flex-col items-center">
        <p className="text-[10px] font-black tracking-[0.5em] text-green-500 uppercase">
          Reconfiguration Complete
        </p>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mt-4 italic font-serif tracking-tighter uppercase leading-none">
          Access <span className="text-green-500">Restored</span>
        </h1>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed mt-6 max-w-[280px] font-bold uppercase tracking-widest opacity-80">
          Your new access key has been committed to the secure registry. The account is now ready for re-establishment.
        </p>
      </div>

      <div className="w-full pt-4">
        <Button
          asChild
          className="w-full bg-[#1b6b3e] hover:bg-[#155430] dark:bg-green-600 dark:hover:bg-green-500 text-white h-16 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_20px_40px_-15px_rgba(27,107,62,0.3)] transition-all active:scale-[0.98] group"
        >
          <Link href="/login" className="flex items-center justify-center gap-3">
             <span>Return to Gateway</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </Button>
      </div>

      <p className="text-[9px] font-black text-gray-300 dark:text-gray-800 uppercase tracking-widest pt-4">
        Encrypted Session: Secure-ID::RESTORED
      </p>
    </div>
  )
}

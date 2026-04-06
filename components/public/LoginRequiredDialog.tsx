'use client'
 
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
 
interface LoginRequiredDialogProps {
  isOpen: boolean
  onClose: () => void
}
 
export default function LoginRequiredDialog({ isOpen, onClose }: LoginRequiredDialogProps) {
  const pathname = usePathname()
 
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[2rem] border-gray-100 shadow-2xl p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center mb-6 border border-green-100 shadow-sm">
             <MessageCircle className="w-8 h-8 text-[#1b6b3e]" />
          </div>
 
          <DialogTitle className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
             Sign in to contact vendors
          </DialogTitle>
          <DialogDescription className="text-gray-500 font-medium text-sm leading-relaxed mb-10 max-w-[300px]">
             You need a buyer account to send messages to vendors. It is free and only takes a minute to set up.
          </DialogDescription>
 
          <div className="w-full flex flex-col gap-3">
             <Button 
               asChild
               className="w-full h-14 rounded-2xl bg-[#1b6b3e] hover:bg-[#155430] text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-green-900/10 transition-all active:scale-[0.98]"
             >
               <Link href={`/login?redirect=${pathname}`}>
                  Sign in
               </Link>
             </Button>
             <Button 
               asChild
               variant="outline"
               className="w-full h-14 rounded-2xl border-gray-200 bg-white hover:bg-gray-50 text-gray-900 font-black text-sm uppercase tracking-widest transition-all"
             >
               <Link href="/register?type=buyer">
                  Create buyer account
               </Link>
             </Button>
          </div>
 
          <div className="mt-8 pt-8 border-t border-gray-100 w-full">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
               Already browsing as a guest? <br /> You can still view prices and compare markets without an account.
             </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

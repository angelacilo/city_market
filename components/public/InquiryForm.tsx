'use client'
 
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { startConversation } from '@/lib/actions/messenger'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  MessageCircle, 
  Store, 
  MapPin, 
  ShoppingBag, 
  Loader2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
 
interface InquiryFormProps {
  isOpen: boolean
  onClose: () => void
  vendorId: string
  listingId: string | null
  productName: string
  vendorName: string
  marketName: string
  price: number | null
  unit: string | null
  productImage?: string | null
}
 
export default function InquiryForm({
  isOpen,
  onClose,
  vendorId,
  listingId,
  productName,
  vendorName,
  marketName,
  price,
  unit,
  productImage,
}: InquiryFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingConversationId, setExistingConversationId] = useState<string | null>(null)
  const [isCheckingConversation, setIsCheckingConversation] = useState(true)
 
  // 1. Check for session (Optional: we already know they have session from InquiryTrigger)
  useEffect(() => {
    if (!isOpen) return
    setIsCheckingConversation(false)
  }, [isOpen])
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
 
    try {
      const convId = await startConversation({
        vendorId,
        listingId,
        productName,
        vendorName,
        marketName,
        price,
        unit,
        productImage,
        firstMessage: message,
      })
 
      toast.success('Conversation started successfully!')
      onClose()
      // Dispatch event to open floating chat with this conversation
      window.dispatchEvent(new CustomEvent('open-conversation', { 
        detail: { conversationId: convId } 
      }))
    } catch (error) {
      console.error(error)
      toast.error('Failed to start conversation. Please try again.')
    } finally {
      setLoading(false)
    }
  }
 
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl dark:bg-[#0a0f0a]">
        <DialogHeader className="px-10 pt-12 pb-8 bg-[#1b6b3e] dark:bg-green-600 text-white relative">
          <div className="flex items-center gap-5 mb-8 relative z-10">
             <div className="p-4 bg-white/10 rounded-[1.5rem] backdrop-blur-sm border border-white/5 shadow-xl">
                <ShoppingBag className="w-7 h-7" />
             </div>
             <div className="flex flex-col">
                <DialogTitle className="text-3xl font-black tracking-tight font-serif italic">Contact Vendor</DialogTitle>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Establish secure connection</p>
             </div>
          </div>
          
          <div className="bg-black/15 dark:bg-black/30 rounded-[2rem] p-6 border border-white/5 space-y-4 relative z-10 backdrop-blur-md">
             <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-1.5 underline decoration-[#1b6b3e] underline-offset-4">Transaction Hub</p>
                   <h4 className="text-lg font-black uppercase tracking-tight truncate leading-none">{productName}</h4>
                </div>
                <div className="text-right shrink-0">
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-1.5">Value Rate</p>
                   <p className="text-2xl font-black leading-none">₱{price?.toFixed(2)} <span className="text-[10px] font-medium opacity-50">/ {unit}</span></p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                    <Store className="w-4 h-4 text-white/40" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/80 truncate leading-none">{vendorName}</span>
                </div>
                <div className="flex items-center gap-3 justify-end">
                   <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white/40" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/80 truncate leading-none">{marketName}</span>
                </div>
             </div>
          </div>
 
          {/* Subtle bg pattern */}
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <MessageCircle className="w-32 h-32 rotate-12" />
          </div>
        </DialogHeader>
 
        <div className="p-10 bg-white dark:bg-[#0a0f0a] transition-colors">
          {isCheckingConversation ? (
            <div className="py-24 flex flex-col items-center justify-center">
               <div className="relative">
                  <Loader2 className="w-12 h-12 text-[#1b6b3e] dark:text-green-500 animate-spin mb-8" />
                  <div className="absolute inset-0 w-12 h-12 text-[#1b6b3e]/20 animate-ping rounded-full" />
               </div>
               <p className="text-[10px] font-black text-gray-300 dark:text-gray-800 uppercase tracking-[0.4em] animate-pulse">Scanning server nodes…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] block ml-2">
                  Encrypted Message
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about availability, current price, or stock..."
                  className="min-h-[160px] rounded-[2rem] bg-gray-50 dark:bg-white/5 border-none text-[15px] font-medium p-8 focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#1b6b3e]/20 dark:focus-visible:ring-green-500/20 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 transition-all resize-none shadow-inner"
                  required
                />
              </div>
 
              <Button
                type="submit"
                disabled={loading || !message.trim()}
                className="w-full h-16 rounded-[1.5rem] bg-[#1b6b3e] hover:bg-[#155430] text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-green-900/20 flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Synchronizing…</span>
                  </>
                ) : (
                  <>
                    <span>Submit Inquiry</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
 
              <div className="pt-4 border-t border-gray-50 dark:border-white/5 text-center">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-700 uppercase tracking-widest leading-relaxed">
                  Identity verification active. <br /> Security protocols enabled for this session.
                </p>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

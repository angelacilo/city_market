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
}: InquiryFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingConversationId, setExistingConversationId] = useState<string | null>(null)
  const [isCheckingConversation, setIsCheckingConversation] = useState(true)
 
  // 1. Check for existing conversation on mount
  useEffect(() => {
    if (!isOpen) return
 
    async function checkExisting() {
      setIsCheckingConversation(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsCheckingConversation(false)
        return
      }
 
      const { data } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('listing_id', listingId)
        .eq('vendor_id', vendorId)
        .single()
 
      if (data) {
        setExistingConversationId(data.id)
      }
      setIsCheckingConversation(false)
    }
 
    checkExisting()
  }, [isOpen, listingId, vendorId, supabase])
 
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
        firstMessage: message,
      })
 
      toast.success('Conversation started successfully!')
      onClose()
      router.push(`/user/messages?conversation=${convId}`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to start conversation. Please try again.')
    } finally {
      setLoading(false)
    }
  }
 
  // If conversation already exists, show redirect state
  if (!isCheckingConversation && existingConversationId) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-10 border-gray-100 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-[#1b6b3e]/5 rounded-[2rem] flex items-center justify-center mb-8 border border-[#1b6b3e]/10 shadow-sm animate-pulse">
               <MessageCircle className="w-10 h-10 text-[#1b6b3e]" />
            </div>
            
            <DialogTitle className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
               Existing Chat found
            </DialogTitle>
            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-10 max-w-[280px]">
               You already have an open conversation about this product. Redirecting you to continue your chat...
            </p>
 
            <Button 
               onClick={() => {
                 onClose()
                 router.push(`/user/messages?conversation=${existingConversationId}`)
               }}
               className="w-full h-14 rounded-2xl bg-[#1b6b3e] hover:bg-[#155430] text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-green-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
               <span>Continue Chat</span>
               <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
 
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="px-8 pt-10 pb-6 bg-[#1b6b3e] text-white">
          <div className="flex items-center gap-4 mb-6">
             <div className="p-3 bg-white/10 rounded-2xl">
                <ShoppingBag className="w-6 h-6" />
             </div>
             <DialogTitle className="text-2xl font-black tracking-tight">Contact Vendor</DialogTitle>
          </div>
          
          <div className="bg-black/10 rounded-3xl p-5 border border-white/5 space-y-3">
             <div className="flex items-start justify-between">
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Product Details</p>
                   <h4 className="text-base font-black uppercase tracking-tight">{productName}</h4>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Best Price</p>
                   <p className="text-xl font-black">₱{price?.toFixed(2)} <span className="text-[10px] font-medium opacity-50">/ {unit}</span></p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                   <Store className="w-3.5 h-3.5 text-white/40" />
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 truncate">{vendorName}</span>
                </div>
                <div className="flex items-center gap-2">
                   <MapPin className="w-3.5 h-3.5 text-white/40" />
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 truncate">{marketName}</span>
                </div>
             </div>
          </div>
        </DialogHeader>
 
        <div className="p-8 bg-white">
          {isCheckingConversation ? (
            <div className="py-20 flex flex-col items-center justify-center">
               <Loader2 className="w-10 h-10 text-[#1b6b3e] animate-spin mb-6" />
               <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Scanning server hubs…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block ml-1">
                  Your Message
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Magkano ang bigas karon? Available pa ba? Kailan po kayo bukas?"
                  className="min-h-[140px] rounded-2xl bg-gray-50 border-none text-sm font-medium p-6 focus:ring-2 focus:ring-[#1b6b3e]/10 placeholder:text-gray-400 transition-all resize-none"
                  required
                />
              </div>
 
              <Button
                type="submit"
                disabled={loading || !message.trim()}
                className="w-full h-14 rounded-2xl bg-[#1b6b3e] hover:bg-[#155430] text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-green-900/10 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Transmitting…</span>
                  </>
                ) : (
                  <>
                    <span>Start conversation</span>
                    <MessageCircle className="w-5 h-5" />
                  </>
                )}
              </Button>
 
              <p className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                By starting a conversation, your contact details <br /> will be visible to the vendor for verification.
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'
 
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import InquiryForm from './InquiryForm'
import LoginRequiredDialog from './LoginRequiredDialog'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
 
interface InquiryTriggerProps {
  vendorId: string
  listingId: string | null
  productName: string
  vendorName: string
  marketName: string
  price: number | null
  unit: string | null
  triggerLabel?: string
  triggerVariant?: 'solid' | 'outline' | 'ghost'
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  productImage?: string | null
}
 
export default function InquiryTrigger({
  vendorId,
  listingId,
  productName,
  vendorName,
  marketName,
  price,
  unit,
  triggerLabel = 'Ask Vendor',
  triggerVariant = 'solid',
  triggerSize = 'default',
  productImage,
  className,
}: InquiryTriggerProps) {
  const [showInquiryForm, setShowInquiryForm] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  
  const supabase = createClient()
 
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      setHasSession(!!session)
    }
    checkSession()
  }, [supabase])
 
  const handleTrigger = () => {
    if (hasSession === false) {
      setShowLoginPrompt(true)
    } else if (hasSession === true) {
      setShowInquiryForm(true)
    }
  }
 
  return (
    <>
      <Button
        onClick={handleTrigger}
        variant={triggerVariant === 'solid' ? 'default' : triggerVariant}
        size={triggerSize}
        className={cn(
          triggerVariant === 'solid'
            ? 'bg-[#1b6b3e] hover:bg-[#155430] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-green-900/10'
            : triggerVariant === 'outline' ? 'rounded-2xl border-gray-200 text-gray-700 font-bold text-[10px] uppercase tracking-widest' : '',
          className
        )}
      >
        {triggerLabel && <span>{triggerLabel}</span>}
        <MessageCircle className={cn("w-4 h-4", triggerLabel && "ml-2")} />
      </Button>
 
      {/* Inquiry Form (Main Dialog) */}
      <InquiryForm
        isOpen={showInquiryForm}
        onClose={() => setShowInquiryForm(false)}
        vendorId={vendorId}
        listingId={listingId}
        productName={productName}
        vendorName={vendorName}
        marketName={marketName}
        price={price}
        unit={unit}
        productImage={productImage}
      />
 
      {/* Login Gate Prompt */}
      <LoginRequiredDialog
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { MessageSquare } from 'lucide-react'
import InquiryForm, { InquiryFormProps } from './InquiryForm'

interface InquiryTriggerProps extends InquiryFormProps {
  triggerLabel?: string
  triggerVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon'
}

export default function InquiryTrigger({
  triggerLabel = 'Ask vendor',
  triggerVariant = 'outline',
  triggerSize = 'sm',
  vendorId,
  listingId,
  productName,
  vendorName,
  marketName,
  price,
  unit,
}: InquiryTriggerProps) {
  const [open, setOpen] = useState(false)

  function handleSuccess() {
    // Give the buyer 1.5 seconds to read the success message before closing
    setTimeout(() => setOpen(false), 1500)
  }

  return (
    <>
      <Button
        variant={triggerVariant}
        size={triggerSize}
        onClick={() => setOpen(true)}
        className="w-full min-h-[48px] gap-2 rounded-xl text-xs font-black uppercase tracking-widest italic transition-all hover:bg-green-50 hover:text-green-700 border-gray-100"
      >
        <MessageSquare className="w-4 h-4" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl p-8 rounded-[2.5rem] shadow-2xl border-white/40 focus-visible:ring-0">
          <DialogHeader className="mb-1">
            <DialogTitle className="text-base font-black text-gray-900">Contact vendor</DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Send a message to this vendor about their product listing.
            </DialogDescription>
          </DialogHeader>
          <InquiryForm
            vendorId={vendorId}
            listingId={listingId}
            productName={productName}
            vendorName={vendorName}
            marketName={marketName}
            price={price}
            unit={unit}
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

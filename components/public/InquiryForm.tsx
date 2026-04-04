'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { checkInquiryRateLimit, recordInquirySent } from '@/lib/utils/rateLimit'
import {
  Store,
  MapPin,
  Loader2,
  SendHorizontal,
  Check,
  MessageCircle,
} from 'lucide-react'
import InquiryChat from '../shared/InquiryChat'

// ── Schema ────────────────────────────────────────────────────────────

const inquirySchema = z.object({
  buyerName: z
    .string()
    .min(2, 'Please enter your full name.')
    .max(100, 'Please enter your full name.'),
  buyerContact: z
    .string()
    .regex(
      /^(09\d{9}|639\d{9})$/,
      'Please enter a valid Philippine mobile number starting with 09.'
    ),
  message: z
    .string()
    .min(10, 'Please write a message of at least 10 characters.')
    .max(500, 'Message cannot exceed 500 characters.'),
})

type InquiryFormValues = z.infer<typeof inquirySchema>

// ── Props ─────────────────────────────────────────────────────────────

export interface InquiryFormProps {
  vendorId: string
  listingId: string
  productName: string
  vendorName: string
  marketName: string
  price: number
  unit: string
  onSuccess?: () => void
}

// ── Component ─────────────────────────────────────────────────────────

export default function InquiryForm({
  vendorId,
  listingId,
  productName,
  vendorName,
  marketName,
  price,
  unit,
  onSuccess,
}: InquiryFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [inquiryId, setInquiryId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors, isValid },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    mode: 'onChange',
    defaultValues: { buyerName: '', buyerContact: '', message: '' },
  })

  const messageValue = watch('message') ?? ''
  const charCount = messageValue.length

  async function onSubmit(data: InquiryFormValues) {
    setError('')

    // Rate limit check
    const limit = checkInquiryRateLimit()
    if (!limit.allowed) {
      setError(
        `You have sent too many inquiries recently. Please wait ${limit.remainingMinutes} minute${limit.remainingMinutes === 1 ? '' : 's'} before sending another message.`
      )
      return
    }

    setSubmitting(true)

    const supabase = createClient()
    const { data: insertData, error: supabaseError } = await supabase.from('inquiries').insert({
      vendor_id: vendorId,
      listing_id: listingId,
      buyer_name: data.buyerName.trim(),
      buyer_contact: data.buyerContact.trim(),
      message: data.message.trim(),
      is_read: false,
    }).select('id').single()

    setSubmitting(false)

    if (supabaseError) {
      setError('Something went wrong. Please check your connection and try again.')
      return
    }

    if (insertData && insertData.id) {
       setInquiryId(insertData.id)
       recordInquirySent()
    } else {
       setError('Failed to establish connection. Please try again.')
    }
  }

  // ── Success/Chat view ─────────────────────────────────────────────
  if (inquiryId) {
    const contact = getValues('buyerContact')
    const name = getValues('buyerName')
    
    return (
      <div className="flex flex-col h-full -mx-6 -mb-6">
        <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex items-center justify-between">
           <div>
              <p className="text-[10px] font-black text-green-700 uppercase tracking-widest leading-none">Status</p>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mt-1">Inquiry Sent & Connected</h3>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Real-time</span>
           </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
           <InquiryChat 
             inquiryId={inquiryId} 
             role="buyer" 
             buyerName={name}
             vendorName={vendorName}
           />
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 italic text-[9px] text-gray-400 font-bold text-center">
           Vendors may also contact you via phone: {contact}
        </div>
      </div>
    )
  }

  // ── Form view ────────────────────────────────────────────────────
  return (
    <div>
      {/* Product context strip */}
      <div className="bg-[#f0f9f4] rounded-2xl p-6 mb-6 border border-[#e1eae1]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-[#1d631d] uppercase tracking-widest opacity-60">
              You are inquiring about:
            </p>
            <p className="text-xl font-black text-[#1d631d] leading-none mb-2">{productName}</p>
            <div className="flex flex-wrap gap-4 pt-1">
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold">
                <Store className="w-3.5 h-3.5 text-[#1d631d] opacity-50" />
                {vendorName}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold">
                <MapPin className="w-3.5 h-3.5 text-[#1d631d] opacity-50" />
                {marketName}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
             <div className="text-xl font-black text-gray-900 leading-none">
               ₱{price.toFixed(2)}
             </div>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">per {unit}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Buyer name */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
            Your Name <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('buyerName')}
            placeholder="e.g. Juan dela Cruz"
            className={cn("h-12 text-sm rounded-xl border-gray-100 bg-gray-50/50 px-5 font-bold focus:bg-white transition-all", errors.buyerName && "border-red-400 focus-visible:border-red-400")}
          />
          {errors.buyerName && (
            <p className="text-[10px] text-red-500 font-bold ml-1">{errors.buyerName.message}</p>
          )}
        </div>

        {/* Mobile number */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <p className="text-[9px] text-gray-400 font-bold -mt-0.5 ml-1">Vendors will use this to contact you back.</p>
          <Input
            {...register('buyerContact')}
            type="tel"
            placeholder="e.g. 09171234567"
            maxLength={12}
            className={cn("h-12 text-sm rounded-xl border-gray-100 bg-gray-50/50 px-5 font-bold focus:bg-white transition-all", errors.buyerContact && "border-red-400 focus-visible:border-red-400")}
          />
          {errors.buyerContact && (
            <p className="text-[10px] text-red-500 font-bold ml-1">{errors.buyerContact.message}</p>
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
            Your Message <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('message')}
            rows={4}
            maxLength={500}
            placeholder={`e.g. Magkano ang ${productName} ngayon? Available pa ba? Kailan kayo bukas?`}
            className={cn("w-full min-h-[120px] rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-4 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d631d]/20 transition-all resize-none", errors.message && "border-red-400 focus:ring-red-400")}
          />
          <div className="flex items-center justify-between gap-2 px-1">
            {errors.message ? (
              <p className="text-[10px] text-red-500 font-bold">{errors.message.message}</p>
            ) : (
              <span />
            )}
            <p className={cn("text-[10px] font-black tracking-widest", charCount >= 480 ? 'text-amber-500' : 'text-gray-300')}>
              {charCount} / 500
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 rounded-full font-black uppercase text-xs tracking-widest border-gray-200"
            onClick={() => onSuccess?.()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !isValid}
            className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs tracking-widest gap-2 disabled:opacity-50 rounded-full shadow-lg shadow-green-700/10"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SendHorizontal className="w-4 h-4" />
            )}
            Send inquiry
          </Button>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { checkInquiryRateLimit } from '@/lib/utils/rateLimit'
import {
  Store,
  MapPin,
  Loader2,
  SendHorizontal,
  Check,
} from 'lucide-react'

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
  const [submitted, setSubmitted] = useState(false)
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
    const { error: supabaseError } = await supabase.from('inquiries').insert({
      vendor_id: vendorId,
      listing_id: listingId,
      buyer_name: data.buyerName.trim(),
      buyer_contact: data.buyerContact.trim(),
      message: data.message.trim(),
      is_read: false,
    })

    setSubmitting(false)

    if (supabaseError) {
      setError('Something went wrong. Please check your connection and try again.')
      return
    }

    setSubmitted(true)
    onSuccess?.()
  }

  // ── Success view ─────────────────────────────────────────────────
  if (submitted) {
    const contact = getValues('buyerContact')
    const tips = [
      'The vendor typically responds within a few hours.',
      'Make sure your phone is on and accepting calls or messages.',
      'You can also visit the vendor directly at their stall.',
    ]

    return (
      <div className="flex flex-col items-center text-center py-2 space-y-4">
        {/* Animated checkmark */}
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
          <Check className="w-8 h-8 text-white" strokeWidth={3} />
        </div>

        <h3 className="text-lg font-black text-gray-900">Inquiry sent!</h3>

        <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
          Your message has been sent to{' '}
          <span className="font-bold text-gray-700">{vendorName}</span> at{' '}
          <span className="font-bold text-gray-700">{marketName}</span>. They will
          contact you at{' '}
          <span className="font-bold text-green-700">{contact}</span> as soon as
          possible.
        </p>

        {/* Tips box */}
        <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-left space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>

        <Button
          onClick={() => onSuccess?.()}
          className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-black text-sm"
        >
          Done
        </Button>
      </div>
    )
  }

  // ── Form view ────────────────────────────────────────────────────
  return (
    <div>
      {/* Product context strip */}
      <div className="bg-green-50 rounded-xl p-3 mb-4">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
              You are inquiring about:
            </p>
            <p className="text-sm font-black text-green-700 leading-tight">{productName}</p>
          </div>
          <p className="text-sm font-black text-gray-900 text-right">
            ₱{price.toFixed(2)}{' '}
            <span className="text-xs font-medium text-gray-400">per {unit}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
            <Store className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            {vendorName}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            {marketName}
          </span>
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Error banner */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs font-bold text-red-600 leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Buyer name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">
            Your name <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('buyerName')}
            placeholder="e.g. Juan dela Cruz"
            className={`h-11 text-sm ${errors.buyerName ? 'border-red-400 focus-visible:border-red-400' : ''}`}
          />
          {errors.buyerName && (
            <p className="text-xs text-red-500">{errors.buyerName.message}</p>
          )}
        </div>

        {/* Mobile number */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">
            Mobile number <span className="text-red-500">*</span>
          </label>
          <p className="text-[10px] text-gray-400 -mt-0.5">Vendors will use this to contact you back.</p>
          <Input
            {...register('buyerContact')}
            type="tel"
            placeholder="e.g. 09171234567"
            maxLength={12}
            className={`h-11 text-sm ${errors.buyerContact ? 'border-red-400 focus-visible:border-red-400' : ''}`}
          />
          {errors.buyerContact && (
            <p className="text-xs text-red-500">{errors.buyerContact.message}</p>
          )}
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">
            Your message <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('message')}
            rows={4}
            maxLength={500}
            placeholder={`e.g. Magkano ang ${productName} ngayon? Available pa ba? Kailan kayo bukas?`}
            className={`w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y ${errors.message ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
          />
          <div className="flex items-start justify-between gap-2">
            {errors.message ? (
              <p className="text-xs text-red-500 flex-1">{errors.message.message}</p>
            ) : (
              <span />
            )}
            <p className={`text-xs flex-shrink-0 ${charCount >= 480 ? 'text-amber-500 font-bold' : 'text-gray-400'}`}>
              {charCount} / 500
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col xs:flex-row gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-11"
            onClick={() => onSuccess?.()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !isValid}
            className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white font-black gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <SendHorizontal className="w-4 h-4" />
                Send inquiry
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

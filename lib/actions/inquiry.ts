'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const inquirySchema = z.object({
  vendor_id: z.string(),
  listing_id: z.string(),
  buyer_name: z.string().min(1, 'Name is required'),
  buyer_contact: z.string()
    .regex(/^09\d{9}$/, 'Must be a Philippine mobile number starting with 09 and exactly 11 digits'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
})

export async function submitInquiry(formData: z.infer<typeof inquirySchema>) {
  const supabase = await createClient()

  const validated = inquirySchema.safeParse(formData)
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message }
  }

  const { error } = await supabase
    .from('inquiries')
    .insert([
      {
        vendor_id: validated.data.vendor_id,
        listing_id: validated.data.listing_id,
        buyer_name: validated.data.buyer_name,
        buyer_contact: validated.data.buyer_contact,
        message: validated.data.message,
      }
    ])

  if (error) {
    console.error('Error submitting inquiry:', error)
    return { success: false, error: 'Failed to send inquiry. Please try again later.' }
  }

  return { success: true }
}

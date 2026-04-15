'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Initiates a new conversation between a buyer and a vendor.
 * If a conversation already exists, it updates the product context.
 * Automatically inserts the first message as a structured product inquiry.
 */
export async function startConversation({
  vendorId,
  listingId,
  productName,
  vendorName,
  marketName,
  price,
  unit,
  productImage,
  firstMessage,
}: {
  vendorId: string
  listingId: string | null
  productName: string
  vendorName: string
  marketName: string
  price: number | null
  unit: string | null
  productImage?: string | null
  firstMessage: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // 1. Check for existing conversation with this vendor
  const { data: existing } = await supabase
    .from('conversations')
    .select('id, vendor_unread_count')
    .eq('buyer_id', user.id)
    .eq('vendor_id', vendorId)
    .maybeSingle()

  let conversationId = existing?.id

  if (!conversationId) {
    // 2. Create the conversation if it doesn't exist
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        buyer_id: user.id,
        vendor_id: vendorId,
        listing_id: listingId,
        product_name: productName,
        vendor_name: vendorName,
        market_name: marketName,
        price: price,
        unit: unit,
        vendor_unread_count: 0, // Trigger will handle increment
        last_message_at: new Date().toISOString(),
        last_message_content: firstMessage,
        last_sender_type: 'buyer'
      })
      .select()
      .maybeSingle()

    if (convError) throw convError
    conversationId = conversation.id
  } else {
    // 3. Update conversation with latest product context
    await supabase
      .from('conversations')
      .update({
        listing_id: listingId,
        product_name: productName,
        price: price,
        unit: unit,
        // Trigger will handle last_message_at, content, sender_type and counts
      })
      .eq('id', conversationId)
  }

  // 4. Format the product inquiry message as JSON for premium UI
  const inquiryData = {
    type: 'product_inquiry',
    product: {
      name: productName,
      price: price,
      unit: unit,
      image: productImage
    },
    text: firstMessage
  }

  // 5. Insert the message with initial status 'sent'
  const { error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_type: 'buyer',
      content: JSON.stringify(inquiryData),
      status: 'sent'
    })

  if (msgError) throw msgError

  revalidatePath('/user/messages')
  revalidatePath('/vendor/inquiries')

  return conversationId
}

/**
 * Sends a generic text message in an existing conversation.
 * Updates the unread count for the recipient and timestamp for the conversation header.
 */
export async function sendMessage({
  conversationId,
  senderType,
  content
}: {
  conversationId: string
  senderType: 'buyer' | 'vendor'
  content: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // 1. Insert message with initial status 'sent'
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_type: senderType,
      content: content,
      status: 'sent'
    })
    .select()
    .maybeSingle()

  if (msgError) throw msgError

  // 2. Update conversation header
  const updatePayload: any = {
    last_message_at: new Date().toISOString(),
    last_message_content: content,
    last_sender_type: senderType
  }

  // Fetch current counts and update for reliability
  const { data: conv } = await supabase
    .from('conversations')
    .select('buyer_unread_count, vendor_unread_count')
    .eq('id', conversationId)
    .maybeSingle()

  if (conv) {
    if (senderType === 'buyer') {
      updatePayload.vendor_unread_count = (conv.vendor_unread_count || 0) + 1
    } else {
      updatePayload.buyer_unread_count = (conv.buyer_unread_count || 0) + 1
    }
  }

  const { error: convUpdateError } = await supabase
    .from('conversations')
    .update(updatePayload)
    .eq('id', conversationId)

  if (convUpdateError) throw convUpdateError

  revalidatePath('/user/messages')
  revalidatePath('/vendor/inquiries')

  return message
}

/**
 * Specialized function for vendors to send messages.
 * Maps the vendor's auth user ID to their internal vendor ID record.
 */
export async function sendVendorMessage({
  conversationId,
  content,
  vendorUserId,
}: {
  conversationId: string
  content: string
  vendorUserId: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // 1. Get vendor ID from user_id
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', vendorUserId)
    .maybeSingle()

  if (vendorError || !vendor) throw new Error('Vendor not found')

  // 2. Insert message with initial status 'sent'
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: vendorUserId,
      sender_type: 'vendor',
      content: content,
      status: 'sent'
    })
    .select()
    .single()

  if (msgError) throw msgError

  // 3. Update conversation - counts and metadata now handled by database trigger
  // No need for manual update here unless we want to update non-trigger fields
  
  revalidatePath('/user/messages')
  revalidatePath('/vendor/inquiries')

  return message
}

/**
 * Resets the unread message count for a specific user type (buyer or vendor)
 * once they open a conversation.
 */
export async function markConversationRead(conversationId: string, readerType: 'buyer' | 'vendor') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const updatePayload: any = {}
  if (readerType === 'buyer') {
    updatePayload.buyer_unread_count = 0
  } else {
    updatePayload.vendor_unread_count = 0
  }

  // 1. Update conversation counts
  const { error: convError } = await supabase
    .from('conversations')
    .update(updatePayload)
    .eq('id', conversationId)

  if (convError) throw convError

  revalidatePath('/user/messages')
  revalidatePath('/vendor/inquiries')
}

/**
 * Updates the status of messages to 'delivered' for real-time receipt indicators.
 */
export async function markMessagesDelivered(
  conversationId: string,
  senderType: 'buyer' | 'vendor'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Mark all messages from opposite sender type as 'delivered'
  const { error } = await supabase
    .from('messages')
    .update({ status: 'delivered' })
    .eq('conversation_id', conversationId)
    .eq('sender_type', senderType)
    .eq('status', 'sent')

  if (error) throw error

  revalidatePath('/user/messages')
  revalidatePath('/vendor/inquiries')
}

/**
 * Bulk updates message statuses to 'seen'.
 */
export async function markMessagesSeen(messageIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  if (messageIds.length === 0) return

  // Mark messages as seen
  const { error } = await supabase
    .from('messages')
    .update({ status: 'seen' })
    .in('id', messageIds)

  if (error) throw error

  revalidatePath('/user/messages')
  revalidatePath('/vendor/inquiries')
}

/**
 * Robustly sets the online/offline status of a user.
 * Updates the respective profile table (buyer_profiles or vendors) with heartbeat timestamps.
 */
export async function setUserOnlineStatus(
  userId: string,
  userType: 'buyer' | 'vendor',
  isOnline: boolean
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const now = new Date().toISOString()

  if (userType === 'buyer') {
    const { error } = await supabase
      .from('buyer_profiles')
      .update({
        is_online: isOnline,
        last_seen_at: now
      })
      .eq('user_id', userId)

    if (error) throw error
  } else {
    const { error } = await supabase
      .from('vendors')
      .update({
        is_online: isOnline,
        last_seen_at: now
      })
      .eq('user_id', userId)

    if (error) throw error
  }

  revalidatePath('/user/messages')
  revalidatePath('/vendor/inquiries')
}

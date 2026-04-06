'use server'
 
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
 
export async function startConversation({
  vendorId,
  listingId,
  productName,
  vendorName,
  marketName,
  price,
  unit,
  firstMessage,
}: {
  vendorId: string
  listingId: string | null
  productName: string
  vendorName: string
  marketName: string
  price: number | null
  unit: string | null
  firstMessage: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
 
  if (!user) throw new Error('Not authenticated')
 
  // 1. Create the conversation
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
      vendor_unread_count: 1, // New thread has 1 unread message for vendor
      last_message_at: new Date().toISOString()
    })
    .select()
    .single()
 
  if (convError) {
    if (convError.code === '23505') {
       // Unique constraint violation - return existing instead or handle error
       // (Though check happens in UI, safety check here)
       const { data: existing } = await supabase
         .from('conversations')
         .select('id')
         .eq('buyer_id', user.id)
         .eq('listing_id', listingId)
         .single()
       if (existing) return existing.id
    }
    throw convError
  }
 
  // 2. Insert the first message
  const { error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      sender_type: 'buyer',
      content: firstMessage
    })
 
  if (msgError) throw msgError
 
  revalidatePath('/user/messages')
  revalidatePath('/vendor/inquiries')
  
  return conversation.id
}
 
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
 
  // 1. Insert message
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_type: senderType,
      content: content
    })
    .select()
    .single()
 
  if (msgError) throw msgError
 
  // 2. Update conversation header
  const updatePayload: any = {
    last_message_at: new Date().toISOString()
  }
 
  if (senderType === 'buyer') {
    updatePayload.vendor_unread_count = supabase.rpc('increment', { row_id: conversationId, table_name: 'conversations', column_name: 'vendor_unread_count' })
    // Since we don't have a simple increment RPC, we'll fetch and update or use a direct SQL approach.
    // For now, let's assume raw SQL or fetching the current value.
  } else {
    updatePayload.buyer_unread_count = supabase.rpc('increment', { row_id: conversationId, table_name: 'conversations', column_name: 'buyer_unread_count' })
  }
 
  // Actually, let's fetch current counts and update for reliability without custom RPC.
  const { data: conv } = await supabase
    .from('conversations')
    .select('buyer_unread_count, vendor_unread_count')
    .eq('id', conversationId)
    .single()
 
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
 
  // 2. Mark messages as read (sender is opposite type)
  const oppositeType = readerType === 'buyer' ? 'vendor' : 'buyer'
  const { error: msgError } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('sender_type', oppositeType)
    .is('read_at', null)
 
  if (msgError) throw msgError
 
  revalidatePath('/user/messages')
  revalidatePath('/vendor/inquiries')
}

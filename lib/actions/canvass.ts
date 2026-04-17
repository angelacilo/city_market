'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Adds a master product to the buyer's personal canvass list for price comparison.
 * Handles automatic creation of the canvass list if it's the user's first item.
 */
// v2 - refreshed for deployment
export async function addToCanvass(productId: string) {
  const supabase = await createClient()

  // 0. Get current user from session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[CANVASS] Auth error or no user:', authError)
    return { error: 'Authentication required.' }
  }
  const userId = user.id

  console.log('[CANVASS] addToCanvass start:', { productId, userId })

  // 1. Resolve the internal buyer profile ID from the user's auth ID
  const { data: profile, error: profileFetchError } = await supabase
    .from('buyer_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileFetchError) {
    console.error('[CANVASS] Profile fetch error:', profileFetchError)
    return { error: profileFetchError.message }
  }

  if (!profile) {
    console.warn('[CANVASS] Buyer profile not found for user_id:', userId)
    return { error: 'Buyer profile not found.' }
  }

  console.log('[CANVASS] Resolved profile:', profile)

  // 2. Fetch or initialize the user's main canvass list
  let { data: list, error: listError } = await supabase
    .from('canvass_lists')
    .select('id')
    .eq('buyer_id', profile.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (listError) {
    console.error('[CANVASS] List fetch error:', listError)
    return { error: listError.message }
  }

  let listId: string
  if (!list) {
    console.log('[CANVASS] Creating new list for buyer_id:', profile.id)
    // Lazily create the list record if it doesn't exist yet
    const { data: newList, error: createError } = await supabase
      .from('canvass_lists')
      .insert({ buyer_id: profile.id, name: 'My Canvass List' })
      .select('id')
      .maybeSingle()

    if (createError) {
      console.error('[CANVASS] List creation error:', createError)
      return { error: createError.message }
    }
    if (!newList) {
      console.error('[CANVASS] List creation returned no data')
      return { error: 'Failed to create list.' }
    }
    listId = newList.id
    console.log('[CANVASS] Created new list_id:', listId)
  } else {
    listId = list.id
    console.log('[CANVASS] Using existing list_id:', listId)
  }

  // 3. Add item to the list
  // First check if already exists
  const { data: existing, error: existingError } = await supabase
    .from('canvass_items')
    .select('id')
    .eq('canvass_list_id', listId)
    .eq('product_id', productId)
    .maybeSingle()

  if (existingError) {
    console.error('[CANVASS] Existing item check error:', existingError)
    return { error: existingError.message }
  }

  if (existing) {
    console.log('[CANVASS] Item already exists in list')
    return { status: 'already_exists' }
  }

  console.log('[CANVASS] Inserting item:', { listId, productId, buyer_id: profile.id })
  const { error: insertError } = await supabase
    .from('canvass_items')
    .insert({ 
      canvass_list_id: listId, 
      product_id: productId,
      buyer_id: profile.id
    })

  if (insertError) return { error: insertError.message }

  // Trigger cache revalidation to update the Navbar badge and list view
  revalidatePath('/')
  return { status: 'success' }
}

/**
 * Updates the quantity of a canvass item (e.g., 0.5 kg, 2 units).
 * Only the owning buyer can update their own items.
 */
export async function updateCanvassQuantity(itemId: string, quantity: number) {
  if (quantity <= 0) return { error: 'Quantity must be greater than 0.' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Authentication required.' }

  // Resolve buyer profile for ownership check
  const { data: profile } = await supabase
    .from('buyer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) return { error: 'Buyer profile not found.' }

  const { error } = await supabase
    .from('canvass_items')
    .update({ quantity })
    .eq('id', itemId)
    .eq('buyer_id', profile.id) // security: only own items

  if (error) return { error: error.message }

  revalidatePath('/')
  return { status: 'success' }
}


/**
 * Removes a specific item from the canvass list.
 */
export async function removeFromCanvass(itemId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('canvass_items')
    .delete()
    .eq('id', itemId)

  if (error) return { error: error.message }
  revalidatePath('/')
  return { status: 'success' }
}

/**
 * Resets the entire canvass list by deleting all associated items.
 */
export async function clearCanvass(listId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('canvass_items')
    .delete()
    .eq('canvass_list_id', listId)

  if (error) return { error: error.message }
  revalidatePath('/')
  return { status: 'success' }
}

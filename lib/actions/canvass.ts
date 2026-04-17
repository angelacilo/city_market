'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Adds a master product to the buyer's personal canvass list for price comparison.
 * Handles automatic creation of the canvass list if it's the user's first item.
 */
export async function addToCanvass(productId: string, userId: string) {
  const supabase = await createClient()

  // 1. Resolve the internal buyer profile ID from the user's auth ID
  const { data: profile } = await supabase
    .from('buyer_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!profile) return { error: 'Buyer profile not found.' }

  // 2. Fetch or initialize the user's main canvass list
  const { data: list, error: listError } = await supabase
    .from('canvass_lists')
    .select('id')
    .eq('buyer_id', profile.id)
    .maybeSingle()

  if (listError) return { error: listError.message }

  let listId: string
  if (!list) {
    // Lazily create the list record if it doesn't exist yet
    const { data: newList, error: createError } = await supabase
      .from('canvass_lists')
      .insert({ buyer_id: profile.id, name: 'My Canvass List' })
      .select('id')
      .maybeSingle()

    if (createError) return { error: createError.message }
    if (!newList) return { error: 'Failed to create list.' }
    listId = newList.id
  } else {
    listId = list.id
  }

  // 3. Duplication check: Prevent adding the same product multiple times
  const { data: existing } = await supabase
    .from('canvass_items')
    .select('id')
    .eq('canvass_list_id', listId)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) return { status: 'already_exists' }

  // 4. Link the product to the user's list
  const { error: insertError } = await supabase
    .from('canvass_items')
    .insert({ canvass_list_id: listId, product_id: productId, buyer_id: profile.id })

  if (insertError) return { error: insertError.message }

  // Trigger cache revalidation to update the Navbar badge and list view
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

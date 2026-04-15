'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addToCanvass(productId: string, userId: string) {
  const supabase = await createClient()

  // 1. Get the profile for this user
  const { data: profile } = await supabase
    .from('buyer_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!profile) return { error: 'Buyer profile not found.' }

  // 2. Get or create canvass list for the profile
  const { data: list, error: listError } = await supabase
    .from('canvass_lists')
    .select('id')
    .eq('buyer_id', profile.id)
    .maybeSingle()

  if (listError) return { error: listError.message }

  let listId: string
  if (!list) {
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

  // 3. Check if product already exists in the list
  const { data: existing } = await supabase
    .from('canvass_items')
    .select('id')
    .eq('canvass_list_id', listId)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) return { status: 'already_exists' }

  // 4. Insert into canvass_items
  const { error: insertError } = await supabase
    .from('canvass_items')
    .insert({ canvass_list_id: listId, product_id: productId })

  if (insertError) return { error: insertError.message }

  revalidatePath('/')
  return { status: 'success' }
}

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

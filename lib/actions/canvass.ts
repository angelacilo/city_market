'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addToCanvass(productId: string, buyerId: string) {
  const supabase = await createClient()

  // 1. Get or create canvass list for the buyer
  let { data: list, error: listError } = await supabase
    .from('canvass_lists')
    .select('id')
    .eq('buyer_id', buyerId)
    .single()

  if (listError && listError.code !== 'PGRST116') {
    return { error: listError.message }
  }

  let listId: string
  if (!list) {
    const { data: newList, error: createError } = await supabase
      .from('canvass_lists')
      .insert({ buyer_id: buyerId, name: 'My Canvass List' })
      .select('id')
      .single()

    if (createError) return { error: createError.message }
    listId = newList.id
  } else {
    listId = list.id
  }

  // 2. Check if product already exists in the list
  const { data: existing, error: checkError } = await supabase
    .from('canvass_items')
    .select('id')
    .eq('list_id', listId)
    .eq('product_id', productId)
    .single()

  if (existing) return { status: 'already_exists' }

  // 3. Insert into canvass_items
  const { error: insertError } = await supabase
    .from('canvass_items')
    .insert({ list_id: listId, product_id: productId })

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
    .eq('list_id', listId)

  if (error) return { error: error.message }
  revalidatePath('/')
  return { status: 'success' }
}

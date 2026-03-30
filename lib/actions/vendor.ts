'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ── Listings ──────────────────────────────────────────────────────────

export async function addListing(formData: {
  vendor_id: string
  market_id: string
  product_id?: string
  custom_product_name?: string
  custom_category_id?: string
  unit?: string
  image_url?: string
  stock_quantity?: number
  price: number
  is_available: boolean
}) {
  try {
    const supabase = await createClient()

    let finalProductId = formData.product_id

    // 1. If custom product name is provided (New Product), insert to master catalog first
    if (formData.custom_product_name) {
       const { data: newProduct, error: prodErr } = await supabase.from('products').insert({
         name: formData.custom_product_name,
         category_id: formData.custom_category_id || null,
         unit: formData.unit || 'piece',
         image_url: formData.image_url || null,
       }).select('id').single()

       if (prodErr || !newProduct) {
         return { error: 'Failed to create custom master product: ' + (prodErr?.message || 'Unknown RLS block. Did you execute the migration script?') }
       }
       finalProductId = newProduct.id
    }

    if (!finalProductId) {
       return { error: 'A product ID is required.' }
    }

    // 2. Insert specific price listing for the vendor
    const { error } = await supabase.from('price_listings').insert({
      vendor_id: formData.vendor_id,
      market_id: formData.market_id,
      product_id: finalProductId,
      price: formData.price,
      is_available: formData.is_available,
      last_updated: new Date().toISOString(),
      stock_quantity: formData.stock_quantity || 0,
    })

    if (error) return { error: error.message }

    revalidatePath('/vendor/products')
    revalidatePath('/vendor/dashboard')
    revalidatePath(`/stalls/${formData.vendor_id}`)
    revalidatePath(`/markets/${formData.market_id}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'An unexpected error occurred during insert.' }
  }
}

export async function updateProductImage(productId: string, imageUrl: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', productId)

    if (error) return { error: error.message }
    revalidatePath('/vendor/products')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Unexpected error updating product image.' }
  }
}

export async function deleteListing(listingId: string) {
  const supabase = await createClient()

  // Delete related price history first
  await supabase.from('price_history').delete().eq('listing_id', listingId)

  const { error } = await supabase.from('price_listings').delete().eq('id', listingId)

  if (error) return { error: error.message }

  revalidatePath('/vendor/products')
  revalidatePath('/vendor/dashboard')
  return { success: true }
}

export async function updateListingPrice(listingId: string, newPrice: number) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('price_listings')
    .update({ price: newPrice, last_updated: now })
    .eq('id', listingId)

  if (error) return { error: error.message }

  // Insert into price history
  await supabase.from('price_history').insert({
    listing_id: listingId,
    price: newPrice,
    recorded_at: now,
  })

  revalidatePath('/vendor/products')
  revalidatePath('/vendor/prices')
  return { success: true }
}

export async function toggleAvailability(listingId: string, isAvailable: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('price_listings')
    .update({ is_available: isAvailable, last_updated: new Date().toISOString() })
    .eq('id', listingId)

  if (error) return { error: error.message }

  revalidatePath('/vendor/products')
  return { success: true }
}

export async function updateListing(
  listingId: string,
  data: {
    price: number
    is_available: boolean
    stock_quantity: number
  }
) {
  try {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data: currentListing } = await supabase
      .from('price_listings')
      .select('price')
      .eq('id', listingId)
      .single()

    const { error } = await supabase
      .from('price_listings')
      .update({
        price: data.price,
        is_available: data.is_available,
        stock_quantity: data.stock_quantity,
        last_updated: now,
      })
      .eq('id', listingId)

    if (error) return { error: error.message }

    // If price changed, record in history
    if (currentListing && currentListing.price !== data.price) {
      await supabase.from('price_history').insert({
        listing_id: listingId,
        price: data.price,
        recorded_at: now,
      })
    }

    revalidatePath('/vendor/products')
    revalidatePath('/vendor/prices')
    revalidatePath('/vendor/dashboard')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Failed to update listing.' }
  }
}

// ── Bulk price update ─────────────────────────────────────────────────

export async function bulkUpdatePrices(
  updates: { listingId: string; newPrice: number }[]
): Promise<{ success: boolean; failed: string[] }> {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const failed: string[] = []

  for (const { listingId, newPrice } of updates) {
    const { error } = await supabase
      .from('price_listings')
      .update({ price: newPrice, last_updated: now })
      .eq('id', listingId)

    if (error) {
      failed.push(listingId)
      continue
    }

    await supabase.from('price_history').insert({
      listing_id: listingId,
      price: newPrice,
      recorded_at: now,
    })
  }

  revalidatePath('/vendor/prices')
  revalidatePath('/vendor/dashboard')
  return { success: failed.length === 0, failed }
}

// ── Inquiries ─────────────────────────────────────────────────────────

export async function markInquiryRead(inquiryId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('inquiries')
    .update({ is_read: true })
    .eq('id', inquiryId)

  if (error) return { error: error.message }

  revalidatePath('/vendor/inquiries')
  revalidatePath('/vendor/dashboard')
  return { success: true }
}

// ── Profile ───────────────────────────────────────────────────────────

export async function updateVendorProfile(
  vendorId: string,
  data: {
    business_name: string
    owner_name?: string
    stall_number?: string
    contact_number?: string
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('vendors')
    .update({
      business_name: data.business_name,
      owner_name: data.owner_name || null,
      stall_number: data.stall_number || null,
      contact_number: data.contact_number || null,
    })
    .eq('id', vendorId)

  if (error) return { error: error.message }

  revalidatePath('/vendor/profile')
  revalidatePath('/vendor/dashboard')
  return { success: true }
}

export async function selfApproveVendor(vendorId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('vendors')
    .update({ is_approved: true })
    .eq('id', vendorId)

  if (error) return { error: error.message }

  revalidatePath('/vendor/layout')
  revalidatePath('/vendor/dashboard')
  return { success: true }
}

export async function seedInitialCatalog() {
  const supabase = await createClient()

  // 1. Categories
  const categories = [
    { name: 'Rice & grains', icon: 'Wheat' },
    { name: 'Meat',          icon: 'Beef' },
    { name: 'Seafood',       icon: 'Fish' },
    { name: 'Vegetables',    icon: 'Leaf' },
    { name: 'Fruits',        icon: 'Apple' },
    { name: 'Dry goods',     icon: 'PackageIcon' },
  ]

  const { data: catData, error: catError } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'name' })
    .select('id, name')

  if (catError) return { error: 'Categories: ' + catError.message }

  const getCatId = (name: string) => catData.find((c: any) => c.name === name)?.id

  // 2. Products
  const products = [
    { name: 'Well-milled Rice', unit: 'kg', category_id: getCatId('Rice & grains') },
    { name: 'Premium Rice',     unit: 'kg', category_id: getCatId('Rice & grains') },
    { name: 'Pork Liempo',      unit: 'kg', category_id: getCatId('Meat') },
    { name: 'Whole Chicken',    unit: 'kg', category_id: getCatId('Meat') },
    { name: 'Bangus (Medium)',  unit: 'kg', category_id: getCatId('Seafood') },
    { name: 'Tilapia',          unit: 'kg', category_id: getCatId('Seafood') },
    { name: 'Carrots',          unit: 'kg', category_id: getCatId('Vegetables') },
    { name: 'Potato',           unit: 'kg', category_id: getCatId('Vegetables') },
    { name: 'Mango (Ripe)',      unit: 'kg', category_id: getCatId('Fruits') },
  ]

  const { error: prodError } = await supabase
    .from('products')
    .upsert(products, { onConflict: 'name' })

  if (prodError) return { error: 'Products: ' + prodError.message }

  revalidatePath('/vendor/products')
  return { success: true }
}

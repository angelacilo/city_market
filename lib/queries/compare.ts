import { createClient } from '@/lib/supabase/server'

export interface ComparisonListing {
  id: string
  price: number
  is_available: boolean
  last_updated: string
  vendor_id: string
  market_id: string
  product_id: string
  products: {
    id: string
    name: string
    unit: string
  } | null
  vendors: {
    id: string
    business_name: string
    stall_number: string | null
    contact_number: string | null
    owner_name: string | null
  } | null
  markets: {
    id: string
    name: string
    barangay: string | null
    address: string | null
  } | null
}

export interface ProductWithCategory {
  id: string
  name: string
  unit: string
  categories: {
    name: string
  } | null
}

export async function fetchComparisonData(productId: string): Promise<ComparisonListing[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('price_listings')
    .select(`
      id,
      price,
      is_available,
      last_updated,
      vendor_id,
      market_id,
      product_id,
      products ( id, name, unit ),
      vendors ( id, business_name, stall_number, contact_number, owner_name ),
      markets ( id, name, barangay, address )
    `)
    .eq('product_id', productId)
    .order('price', { ascending: true })

  if (error) {
    console.error('Error fetching comparison data:', error)
    return []
  }

  return (data as unknown as ComparisonListing[]) || []
}

export async function fetchProductsWithCategories(): Promise<ProductWithCategory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      unit,
      categories ( name )
    `)
    .order('name')

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return (data as unknown as ProductWithCategory[]) || []
}

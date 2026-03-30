export interface Market {
  id: string
  name: string
  barangay: string | null
  image_url: string | null
  is_active: boolean
}

export interface MarketWithStats extends Market {
  vendors_count: number
  products_count: number
}

export interface PriceSnapshot {
  id: string
  price: number
  is_available: boolean
  last_updated: string
  products: { name: string; unit: string } | null
  vendors: { 
    business_name: string
    stall_number: string | null 
  } | null
  markets: { name: string } | null
}

export interface Inquiry {
  id: string
  vendor_id: string
  listing_id: string
  buyer_name: string
  buyer_contact: string
  message: string
  is_read: boolean
  created_at: string
  price_listings?: {
    id?: string
    price?: number
    products?: {
      name: string
      unit: string
    } | null
    vendors?: {
      business_name: string
      stall_number: string | null
    } | null
  } | null
}

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

export interface Conversation {
  id: string
  buyer_id: string
  vendor_id: string
  listing_id: string | null
  product_name: string
  vendor_name: string
  market_name: string
  price: number | null
  unit: string | null
  status: 'open' | 'closed'
  created_at: string
  last_message_at: string
  buyer_unread_count: number
  vendor_unread_count: number
  buyer_profiles?: {
    full_name: string
    is_active?: boolean
  } | null
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'buyer' | 'vendor'
  content: string
  is_read: boolean
  created_at: string
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

export interface CanvassItem {
  id: string
  list_id: string
  product_id: string
  created_at: string
  products: {
    name: string
    category_id: string
    categories: {
      name: string
      color: string | null
    } | null
  } | null
  cheapest_listing?: {
    price: number
    market_name: string
  } | null
}

export interface CanvassList {
  id: string
  buyer_id: string
  name: string
  created_at: string
}

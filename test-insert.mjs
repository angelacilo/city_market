import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function test() {
  const { data: v, error: ve } = await supabase.from('vendors').select('id, market_id, user_id').limit(1).single()
  console.log('Vendor:', v, ve)
  
  if (!v) return;

  const { data: p, error: pe } = await supabase.from('products').select('id').limit(1).single()
  console.log('Product:', p, pe)

  if (!p) return;

  const { data: res, error } = await supabase.from('price_listings').insert({
    vendor_id: v.id,
    market_id: v.market_id,
    product_id: p.id,
    price: 15.50,
    is_available: true
  })
  
  console.log('Insert Result:', res, error)
}

test()

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function test() {
  const { data: v, error: ve } = await supabase.from('vendors').select('*')
  console.log('Vendors:', v, ve)
  
  const { data: p, error: pe } = await supabase.from('price_listings').select('*')
  console.log('Listings:', p, pe)
}

test()

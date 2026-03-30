import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkProducts() {
  const { data, error } = await supabase.from('products').select('*')
  console.log('Products:', data ? data.length : 'null', error)
}

checkProducts()

/**
 * Seed script: inserts the 6 Butuan City public markets into Supabase.
 * Run with: node --env-file=.env.local seed-markets.mjs
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // needs service role to bypass RLS
)

const markets = [
  { name: 'Divisoria Market',        barangay: 'Divisoria',   is_active: true },
  { name: 'Pili Market',             barangay: 'Pili',        is_active: true },
  { name: 'Cogon Market',            barangay: 'Cogon',       is_active: true },
  { name: 'Robinsons Wet Market',    barangay: 'Langihan',    is_active: true },
  { name: 'Libertad Public Market',  barangay: 'Libertad',    is_active: true },
  { name: 'Agora Market',            barangay: 'Agora',       is_active: true },
]

const { data, error } = await supabase
  .from('markets')
  .upsert(markets, { onConflict: 'name', ignoreDuplicates: true })
  .select('id, name')

if (error) {
  console.error('❌ Seed failed:', error.message)
  process.exit(1)
}

console.log('✅ Markets seeded successfully:')
console.table(data)

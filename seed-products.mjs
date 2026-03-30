/**
 * Seed script: inserts categories and standard products into Supabase.
 * Run with: node --env-file=.env.local seed-products.mjs
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // needs service role to bypass RLS
)

const categories = [
  { name: 'Rice & grains', icon: 'Wheat' },
  { name: 'Meat',          icon: 'Beef' },
  { name: 'Seafood',       icon: 'Fish' },
  { name: 'Vegetables',    icon: 'Leaf' },
  { name: 'Fruits',        icon: 'Apple' },
  { name: 'Dry goods',     icon: 'PackageIcon' },
  { name: 'Condiments',    icon: 'FlaskConical' },
]

async function seed() {
  console.log('🌱 Seeding categories...')
  const { data: catData, error: catError } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'name', ignoreDuplicates: true })
    .select('id, name')

  if (catError) {
    console.error('❌ Categories seed failed:', catError.message)
    return
  }
  console.log('✅ Categories seeded.')

  const getCatId = (name) => catData.find(c => c.name === name)?.id

  const products = [
    // Rice
    { name: 'Well-milled Rice', unit: 'kg', category_id: getCatId('Rice & grains') },
    { name: 'Premium Rice',     unit: 'kg', category_id: getCatId('Rice & grains') },
    // Meat
    { name: 'Pork Liempo',      unit: 'kg', category_id: getCatId('Meat') },
    { name: 'Pork Kasim',       unit: 'kg', category_id: getCatId('Meat') },
    { name: 'Whole Chicken',    unit: 'kg', category_id: getCatId('Meat') },
    { name: 'Beef Brisket',     unit: 'kg', category_id: getCatId('Meat') },
    // Seafood
    { name: 'Bangus (Medium)',  unit: 'kg', category_id: getCatId('Seafood') },
    { name: 'Tilapia',          unit: 'kg', category_id: getCatId('Seafood') },
    { name: 'Galunggong',       unit: 'kg', category_id: getCatId('Seafood') },
    // Vegetables
    { name: 'Sitaw',            unit: 'bundle', category_id: getCatId('Vegetables') },
    { name: 'Carrots',          unit: 'kg', category_id: getCatId('Vegetables') },
    { name: 'Potato',           unit: 'kg', category_id: getCatId('Vegetables') },
    { name: 'Cabbage',          unit: 'kg', category_id: getCatId('Vegetables') },
    // Fruits
    { name: 'Banana (Latundan)', unit: 'kg', category_id: getCatId('Fruits') },
    { name: 'Mango (Ripe)',      unit: 'kg', category_id: getCatId('Fruits') },
    // Dry goods
    { name: 'Eggs (Large)',      unit: 'tray', category_id: getCatId('Dry goods') },
    { name: 'Cooking Oil',       unit: 'L',    category_id: getCatId('Dry goods') },
  ]

  console.log('🌱 Seeding products...')
  const { data: prodData, error: prodError } = await supabase
    .from('products')
    .upsert(products, { onConflict: 'name', ignoreDuplicates: true })
    .select('id, name')

  if (prodError) {
    console.error('❌ Products seed failed:', prodError.message)
    return
  }
  console.log('✅ Products seeded successfully.')
  console.table(prodData)
}

seed()

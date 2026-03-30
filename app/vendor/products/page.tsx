import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductsManager from '@/components/vendor/ProductsManager'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Products — Vendor Dashboard | BCMIS' }

export default async function VendorProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, market_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!vendor) redirect('/register')

  const [{ data: listings }, { data: allProducts }, { data: categories }] = await Promise.all([
    supabase
      .from('price_listings')
      .select(`
        id, price, is_available, last_updated,
        product_id, stock_quantity,
        products ( id, name, unit, category_id, image_url, categories ( name ) )
      `)
      .eq('vendor_id', vendor.id)
      .order('price', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, unit, category_id, image_url, categories ( name )')
      .order('name'),
    supabase
      .from('categories')
      .select('id, name, icon')
      .order('name'),
  ])

  const listingsCount = listings?.length || 0

  return (
    <div className="space-y-8">
      <div>
        <span className="text-sm font-sans font-normal text-gray-500 uppercase tracking-wide block mb-1">
          My
        </span>
        <h1 className="text-4xl font-black italic text-green-700 font-serif leading-none">
          Products
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          {listingsCount} total listing{listingsCount !== 1 ? 's' : ''}
        </p>
      </div>

      <ProductsManager
        listings={(listings as any[]) ?? []}
        allProducts={(allProducts as any[]) ?? []}
        categories={(categories as any[]) ?? []}
        vendorId={vendor.id}
        marketId={vendor.market_id}
      />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductsManager from '@/components/vendor/ProductsManager'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Products — Vendor Dashboard | Butuan City Market' }

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
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-14 custom-scrollbar h-full">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-[#1b6b3e] dark:bg-green-600 rounded-full" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1b6b3e] dark:text-green-500">Inventory Module</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none italic font-serif uppercase">
            Market <span className="text-[#1b6b3e] dark:text-green-500 underline decoration-green-100 dark:decoration-green-900/30 underline-offset-8 decoration-8">Catalog</span>
          </h1>
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 max-w-lg mt-1 uppercase tracking-widest">{listingsCount} active unit{listingsCount !== 1 ? 's' : ''} in network</p>
        </div>

        <ProductsManager
          listings={(listings as any[]) ?? []}
          allProducts={(allProducts as any[]) ?? []}
          categories={(categories as any[]) ?? []}
          vendorId={vendor.id}
          marketId={vendor.market_id}
        />
      </div>
    </div>
  )
}

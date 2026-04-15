import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductsManager from '@/components/vendor/ProductsManager'

export const metadata = { title: 'Manage Products — Vendor Dashboard | Butuan City Market' }

/**
 * Vendor Products Page - Server Component
 * Handles data fetching for the current vendor's inventory and global product assets.
 */
export default async function VendorProductsPage() {
  const supabase = await createClient()
  
  // 1. Authenticate user - Redirect to login if no session exists
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch the vendor's profile associated with the authenticated user
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, market_id')
    .eq('user_id', user.id)
    .single()

  // 3. Fallback: If authorized but no vendor profile exists, prompt for registration
  if (!vendor) redirect('/register')

  // 4. Data Extraction - Retrieve the vendor's specific product listings
  const { data: listings } = await supabase
    .from('price_listings')
    .select('id, price, is_available, stock_quantity, last_updated, product_id, products(id, name, unit, category_id, image_url, categories(name))')
    .eq('vendor_id', vendor.id)
    .order('last_updated', { ascending: false })

  // 5. Fetch Global Asset Catalog - For product selection and dropdowns
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, name, unit, category_id, image_url, categories(name)')
    .order('name')

  // 6. Fetch available market categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon')
    .order('name')

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-14 custom-scrollbar h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <span className="text-sm font-sans font-normal text-gray-500 uppercase tracking-wide block mb-1">
            Manage
          </span>
          <h1 className="text-4xl font-black text-green-700 font-serif leading-none">
            Products
          </h1>
          <p className="text-sm text-gray-400 mt-2 font-medium">
            Add new products to your stall, manage stock, and edit details.
          </p>
        </div>

        {/* Client-side manager for handling interactive product CRUD operations */}
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

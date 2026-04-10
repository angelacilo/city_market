import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PricesManager from '@/components/vendor/PricesManager'

export const metadata = { title: 'Update Prices — Vendor Dashboard | Butuan City Market' }

export default async function VendorPricesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/register')

  const { data: listings } = await supabase
    .from('price_listings')
    .select('id, price, is_available, product_id, products(name, unit, categories(name))')
    .eq('vendor_id', vendor.id)
    .order('price', { ascending: true })

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-14 custom-scrollbar h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <span className="text-sm font-sans font-normal text-gray-500 uppercase tracking-wide block mb-1">
            Update
          </span>
          <h1 className="text-4xl font-black text-green-700 font-serif leading-none">
            Prices
          </h1>
          <p className="text-sm text-gray-400 mt-2 font-medium">
            Manage your stall catalog and set current market rates.
          </p>
        </div>

        <PricesManager listings={(listings as any[]) ?? []} />
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { fetchComparisonData, fetchProductsWithCategories } from '@/lib/queries/compare'
import ComparePageClient from '@/components/compare/ComparePageClient'
import Loading from './loading'

/* ------------------------------------------------------------------ */
/* Dynamic metadata                                                      */
/* ------------------------------------------------------------------ */

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ product?: string }> }
): Promise<Metadata> {
  const params = await searchParams
  const productId = params.product

  if (productId) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('name')
      .eq('id', productId)
      .single()

    const productName = data?.name ?? 'Product'

    return {
      title: `Compare ${productName} prices — Butuan Market IS`,
      description: `See and compare ${productName} prices from all vendors across 6 public markets in Butuan City. Find the best deal before you shop.`,
    }
  }

  return {
    title: 'Price Comparison — Butuan Market IS',
    description:
      'Compare prices of any product across all public markets in Butuan City, Agusan del Norte. Find the cheapest price before you go shopping.',
  }
}

/* ------------------------------------------------------------------ */
/* Page                                                                  */
/* ------------------------------------------------------------------ */

export default async function ComparePage(
  { searchParams }: { searchParams: Promise<{ product?: string }> }
) {
  const params = await searchParams
  const productId = params.product ?? null

  // Fetch all products (always needed for the selector)
  const products = await fetchProductsWithCategories()

  // Fetch initial listings only if a product id is present in the URL
  const initialListings = productId ? await fetchComparisonData(productId) : []

  return (
    <Suspense fallback={<Loading />}>
      <ComparePageClient
        initialProducts={products}
        initialListings={initialListings}
        initialProductId={productId}
      />
    </Suspense>
  )
}

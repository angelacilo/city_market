import { redirect } from 'next/navigation'

const SLUG_TO_QUERY: Record<string, string> = {
  'rice-and-grains': 'Rice',
  meat: 'Pork',
  seafood: 'Bangus',
  vegetables: 'Vegetables',
  fruits: 'Mango',
  'dry-goods': 'Eggs',
  condiments: 'Cooking Oil',
  others: 'Onion',
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  if (category && SLUG_TO_QUERY[category]) {
    redirect(`/search?q=${encodeURIComponent(SLUG_TO_QUERY[category])}`)
  }
  redirect('/search')
}

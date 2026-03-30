import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import {
  IconGrain,
  IconMeat,
  IconFish,
  IconLeaf,
  IconApple,
  IconBox,
  IconBottle,
  IconGridDots,
} from '@/components/home/CategoryIcons'

const CATEGORIES = [
  { name: 'Rice and Grains', subtitle: '14 Varieties available', slug: 'rice-and-grains', Icon: IconGrain },
  { name: 'Meat', subtitle: 'Pork, Beef, Poultry', slug: 'meat', Icon: IconMeat },
  { name: 'Seafood', subtitle: 'Fresh Catch Daily', slug: 'seafood', Icon: IconFish },
  { name: 'Vegetables', subtitle: 'Farm to Table', slug: 'vegetables', Icon: IconLeaf },
  { name: 'Fruits', subtitle: 'Seasonal and Tropical', slug: 'fruits', Icon: IconApple },
  { name: 'Dry Goods', subtitle: 'Canned and Packaged', slug: 'dry-goods', Icon: IconBox },
  { name: 'Condiments', subtitle: 'Spices and Sauces', slug: 'condiments', Icon: IconBottle },
  { name: 'Others', subtitle: 'Household Essentials', slug: 'others', Icon: IconGridDots },
]

export default function CategoriesSection() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-gray-900">
              <span className="block text-3xl font-normal font-sans">Essential</span>
              <span className="block text-3xl font-bold italic font-serif">Categories</span>
            </h2>
            <p className="mt-3 text-sm text-gray-500 max-w-xl">
              Direct access to the most monitored commodities in Butuan City&apos;s local markets.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800 shrink-0"
          >
            View all items
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-green-400 hover:shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50">
                <cat.Icon />
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">{cat.name}</p>
              <p className="mt-1 text-xs text-gray-400">{cat.subtitle}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

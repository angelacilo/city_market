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
    <section className="bg-white dark:bg-[#050a05] py-16 transition-colors duration-500">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-gray-900 dark:text-white">
              <span className="block text-3xl font-normal font-sans">Essential</span>
              <span className="block text-3xl font-bold font-serif italic">Categories</span>
            </h2>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 max-w-xl">
              Direct access to the most monitored commodities in Butuan City&apos;s local markets.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-black uppercase tracking-widest text-[#1b6b3e] dark:text-green-500 hover:text-green-800 shrink-0"
          >
            Explore all items
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="rounded-[1.5rem] border border-gray-100 dark:border-white/5 bg-white dark:bg-white/[0.03] p-6 transition-all hover:border-green-400 dark:hover:border-green-500 hover:shadow-2xl dark:hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 dark:bg-black/40 group-hover:bg-[#1b6b3e] transition-all duration-500">
                <div className="dark:text-white group-hover:text-white transition-colors">
                  <cat.Icon />
                </div>
              </div>
              <p className="mt-4 text-sm font-black text-gray-900 dark:text-white font-serif italic tracking-tight uppercase">{cat.name}</p>
              <p className="mt-1 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest leading-none">{cat.subtitle}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

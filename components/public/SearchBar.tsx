'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  variant?: 'default' | 'hero'
  className?: string
}

export default function SearchBar({ variant = 'default', className }: Props) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const go = () => {
    const q = query.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    go()
  }

  const isHero = variant === 'hero'

  return (
    <form
      onSubmit={handleSearch}
      className={cn(
        'flex w-full items-center gap-3 bg-white shadow-sm',
        isHero
          ? 'h-16 rounded-full border border-gray-100 px-7 shadow-xl shadow-green-900/5 text-lg'
          : 'min-h-12 rounded-full border border-gray-100 px-4 py-2 shadow-sm',
        className
      )}
      role="search"
    >
      <div className="shrink-0 text-gray-400">
        <Search className={isHero ? "h-5 w-5" : "h-4 w-4"} />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for rice, pork, bangus..."
        className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none"
        aria-label="Search for products"
      />
    </form>
  )
}

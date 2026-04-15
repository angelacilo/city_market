import SearchBar from '@/components/public/SearchBar'

export default function SearchPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-black text-center">Search results for <span className="text-green-700">Products</span></h1>
        <SearchBar />
        <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
          No results found. Try adjusting your search.
        </div>
      </div>
    </div>
  )
}

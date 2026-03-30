export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Skeleton */}
      <div className="bg-green-700/50 h-80 sm:h-[450px] animate-pulse flex flex-col items-center justify-center px-4 gap-8">
        <div className="w-48 h-6 bg-green-500/20 rounded-full" />
        <div className="w-full max-w-xl h-24 bg-green-100/10 rounded-2xl" />
        <div className="w-full max-w-lg h-16 bg-white rounded-2xl" />
        <div className="flex gap-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="w-16 h-8 bg-green-100/10 rounded-full hidden sm:block" />
          ))}
        </div>
      </div>

      {/* Stats Strip Skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-8 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-16 h-8 bg-gray-100 rounded-lg" />
              <div className="w-24 h-4 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 space-y-16 animate-pulse">
        {/* Categories Skeleton */}
        <section>
          <div className="flex items-center justify-between mb-8 px-4">
             <div className="w-32 h-6 bg-gray-100 rounded-lg" />
             <div className="w-24 h-4 bg-gray-50 rounded" />
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-7 gap-3 px-4">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className={i > 4 ? "hidden md:flex flex-col gap-3" : "flex flex-col gap-3"}>
                <div className="aspect-square bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                   <div className="w-10 h-10 bg-gray-50 rounded-xl" />
                   <div className="w-12 h-3 bg-gray-50 rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Markets Skeleton */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white border border-gray-50 rounded-2xl h-32 animate-pulse" />
            ))}
          </div>
        </section>

        {/* Price Table Skeleton */}
        <section className="px-4">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden">
             <div className="h-16 bg-gray-50/50 border-b border-gray-50 px-6 flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-gray-100" />
                <div className="w-32 h-4 bg-gray-100 rounded" />
             </div>
             <div className="p-8 space-y-6">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center justify-between">
                     <div className="flex gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl" />
                        <div className="space-y-2">
                           <div className="w-24 h-4 bg-gray-100 rounded" />
                           <div className="w-16 h-3 bg-gray-50 rounded" />
                        </div>
                     </div>
                     <div className="w-20 h-6 bg-gray-100 rounded-lg" />
                     <div className="w-32 h-4 bg-gray-50 rounded hidden sm:block" />
                  </div>
                ))}
             </div>
          </div>
        </section>
      </div>
    </div>
  )
}

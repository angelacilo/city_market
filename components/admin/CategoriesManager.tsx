'use client'

export default function CategoriesManager() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Product Categories</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <button className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold">Add Category</button>
        </div>
        <div className="p-8 text-center text-gray-500">
          No categories defined.
        </div>
      </div>
    </div>
  )
}

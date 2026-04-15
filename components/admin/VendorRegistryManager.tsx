'use client'

export default function VendorRegistryManager() {
  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Registry</h2>
      </div>
      <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Manage all registered vendors and their stall approvals here.</p>
      </div>
    </div>
  )
}

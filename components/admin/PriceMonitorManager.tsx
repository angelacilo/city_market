'use client'

export default function PriceMonitorManager() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Price Monitor</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Market</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Avg Price</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-gray-500">Initializing monitoring data...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

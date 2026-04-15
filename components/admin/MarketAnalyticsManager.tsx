'use client'

export default function MarketAnalyticsManager() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Market Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm font-medium text-green-600">Total Markets</p>
          <p className="text-3xl font-bold">12</p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-medium text-blue-600">Active Vendors</p>
          <p className="text-3xl font-bold">148</p>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-sm font-medium text-purple-600">Daily Inquiries</p>
          <p className="text-3xl font-bold">24</p>
        </div>
      </div>
    </div>
  )
}

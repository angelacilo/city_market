export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto py-8 p-6">
      <h2 className="text-2xl font-bold mb-6">System Settings</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-100 dark:border-gray-700 space-y-8">
        <section>
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Platform Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-4 border rounded-lg">Maintenance Mode: Off</div>
             <div className="p-4 border rounded-lg">New Registrations: Enabled</div>
          </div>
        </section>
      </div>
    </div>
  )
}

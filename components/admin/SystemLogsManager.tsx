'use client'

export default function SystemLogsManager() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">System Event Logs</h2>
      <div className="bg-black text-green-500 font-mono text-sm p-4 rounded-lg h-[400px] overflow-y-auto">
        <p>[2026-04-13 10:45:01] System health check initiated...</p>
        <p>[2026-04-13 10:45:02] Connected to Supabase...</p>
        <p>[2026-04-13 10:45:03] Loading audit logs...</p>
      </div>
    </div>
  )
}

export async function logAdminAction(adminId: string, action: string, details: any) {
  console.log(`[ADMIN LOG] ${adminId} performed ${action}:`, details)
  // Logic to insert into system_logs table
}

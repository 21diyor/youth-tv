/** Department usernames are aliases for real Supabase Auth identities. */
const departmentEmails: Record<string, string> = {
  dashboard: "dashboard@youth-tv.invalid",
  murojaatlar: "murojaatlar@youth-tv.invalid",
  hr2026: "hr2026@youth-tv.invalid",
}
export function loginEmail(identifier: string, dashboardAdmin=false) {
  const normalized = identifier.trim().toLowerCase()
  if(dashboardAdmin&&normalized==='dashboard')return 'dashboard-editor@youth-tv.invalid'
  return departmentEmails[normalized] ?? normalized
}
export function loginDisplayName(email?: string) {
  if(email==='dashboard-editor@youth-tv.invalid')return 'dashboard'
  return Object.entries(departmentEmails).find(([, value]) => value === email)?.[0] ?? email
}

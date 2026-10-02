/** Department usernames are aliases for real Supabase Auth identities. */
const departmentEmails: Record<string, string> = {
  murojaatlar: "murojaatlar@youth-tv.invalid",
  hr2026: "hr2026@youth-tv.invalid",
}
export function loginEmail(identifier: string) {
  const normalized = identifier.trim().toLowerCase()
  return departmentEmails[normalized] ?? normalized
}
export function loginDisplayName(email?: string) {
  return Object.entries(departmentEmails).find(([, value]) => value === email)?.[0] ?? email
}

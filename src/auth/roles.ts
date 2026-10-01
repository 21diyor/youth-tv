// Mirrors the public.app_role enum in Supabase.
export type AppRole =
  | "hr_admin"
  | "super_admin"
  | "appeals_admin"
  | "press_admin"
  | "tv_viewer"

const APP_ROLES: readonly AppRole[] = [
  "hr_admin",
  "super_admin",
  "appeals_admin",
  "press_admin",
  "tv_viewer",
]

/** Roles allowed into /admin. */
export const ADMIN_ROLES: readonly AppRole[] = [
  "hr_admin",
  "super_admin",
  "appeals_admin",
  "press_admin",
]

export function isAppRole(value: unknown): value is AppRole {
  return (
    typeof value === "string" &&
    (APP_ROLES as readonly string[]).includes(value)
  )
}

export type AdminSection =
  | "schedule"
  | "managers"
  | "birthday"
  | "overview"
  | "president"
  | "appeals"
  | "employee"
  | "settings"

// Which roles see which admin section. UI convenience only — the real
// enforcement is Row Level Security and the publish RPCs in Supabase.
export const SECTION_ROLES: Record<AdminSection, readonly AppRole[]> = {
  schedule: ["super_admin", "hr_admin"],
  managers: ["super_admin", "appeals_admin"],
  birthday: ["super_admin", "hr_admin"],
  overview: ["super_admin"],
  president: ["super_admin", "press_admin"],
  appeals: ["super_admin", "appeals_admin"],
  employee: ["super_admin", "hr_admin"],
  settings: ["super_admin"],
}

export function canSeeSection(
  section: AdminSection,
  roles: readonly AppRole[]
): boolean {
  return SECTION_ROLES[section].some((role) => roles.includes(role))
}

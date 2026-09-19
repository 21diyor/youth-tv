// Mirrors the public.app_role enum in Supabase.
export type AppRole =
  | "super_admin"
  | "appeals_admin"
  | "press_admin"
  | "tv_viewer"

const APP_ROLES: readonly AppRole[] = [
  "super_admin",
  "appeals_admin",
  "press_admin",
  "tv_viewer",
]

/** Roles allowed into /admin. */
export const ADMIN_ROLES: readonly AppRole[] = [
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
  | "overview"
  | "president"
  | "appeals"
  | "employee"
  | "settings"

// Which roles see which admin section. UI convenience only — the real
// enforcement is Row Level Security and the publish RPCs in Supabase.
export const SECTION_ROLES: Record<AdminSection, readonly AppRole[]> = {
  overview: ["super_admin"],
  president: ["super_admin", "press_admin"],
  appeals: ["super_admin", "appeals_admin"],
  employee: ["super_admin", "press_admin"],
  settings: ["super_admin"],
}

export function canSeeSection(
  section: AdminSection,
  roles: readonly AppRole[]
): boolean {
  return SECTION_ROLES[section].some((role) => roles.includes(role))
}

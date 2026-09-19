import { clearTvSnapshot } from "@/data/adapters/supabase"

import { isAppRole, type AppRole } from "@/auth/roles"

// Proof that THIS browser completed an online TV authorization (session +
// valid app role, confirmed by Supabase) for a given user. Non-secret:
// no tokens, no passwords. It only permits showing the device's own
// read-only published snapshot while Supabase is unreachable — it is never
// treated as server authorization.
const MARKER_KEY = "youth-tv-verified-access-v1"

export type TvAccessMarker = {
  version: 1
  userId: string
  verifiedAt: string
  roles: AppRole[]
}

export function writeTvAccessMarker(userId: string, roles: AppRole[]) {
  const marker: TvAccessMarker = {
    version: 1,
    userId,
    verifiedAt: new Date().toISOString(),
    roles,
  }

  try {
    localStorage.setItem(MARKER_KEY, JSON.stringify(marker))
  } catch {
    // Storage unavailable: offline boot simply won't be possible.
  }
}

export function readTvAccessMarker(): TvAccessMarker | null {
  try {
    const raw = localStorage.getItem(MARKER_KEY)
    const marker = raw ? (JSON.parse(raw) as TvAccessMarker) : null

    if (
      marker?.version === 1 &&
      typeof marker.userId === "string" &&
      Array.isArray(marker.roles) &&
      marker.roles.length > 0 &&
      marker.roles.every(isAppRole)
    ) {
      return marker
    }
  } catch {
    // Corrupt marker: treat as absent.
  }

  return null
}

/**
 * Deliberate sign-out / device reset, or the server confirmed this account
 * has no valid role: forget the TV authorization and its cached content.
 * The local-backend content keys are not touched.
 */
export function clearTvDeviceCache() {
  try {
    localStorage.removeItem(MARKER_KEY)
  } catch {
    // Storage unavailable: nothing to clear.
  }

  clearTvSnapshot()
}

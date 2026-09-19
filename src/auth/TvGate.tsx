import { useCallback, useEffect } from "react"

import { useAuth } from "@/auth/authContext"
import { GateMessage } from "@/auth/GateMessage"
import type { AppRole } from "@/auth/roles"
import {
  clearTvDeviceCache,
  readTvAccessMarker,
  writeTvAccessMarker,
} from "@/auth/tvAccessMarker"
import { TvLoginPage } from "@/auth/TvLoginPage"
import { TvSignOutShortcut } from "@/auth/TvSignOutShortcut"
import { hasTvSnapshot } from "@/data/adapters/supabase"
import { StoreGate } from "@/data/StoreGate"
import { revalidateTvContent } from "@/data/tvStore"
import { getPersistedSessionUserId, getSupabase } from "@/lib/supabase"
import { Slideshow } from "@/Slideshow"

const TV_CANVAS = "bg-[#FAFAF9]"

/** While Supabase is unreachable, how often to retry the real checks. */
const OFFLINE_RETRY_MS = 30 * 1000

/** Online-authorized TV: record the verified-access marker, show slides. */
function AuthorizedTv({
  userId,
  roles,
}: {
  userId: string
  roles: AppRole[]
}) {
  useEffect(() => {
    writeTvAccessMarker(userId, roles)
    // If we were showing the offline snapshot, go live immediately.
    void revalidateTvContent()
  }, [userId, roles])

  return (
    <StoreGate surface="tv">
      <Slideshow />
      <TvSignOutShortcut />
    </StoreGate>
  )
}

/**
 * `/` entry point on the Supabase backend:
 * session → at least one valid app role (checked online) → published TV
 * store → Slideshow. Being "authenticated" alone is not enough.
 *
 * Offline boot: when Supabase is unreachable (network failure only), a
 * device that previously passed the online check for this same user may
 * show its read-only published snapshot until the real checks succeed.
 * RLS remains the real protection for all server data.
 */
export function TvGate() {
  const auth = useAuth()

  const sessionUserId = auth.user?.id ?? null

  // Supabase unreachable, as opposed to the server answering "no":
  //  (a) session present, role lookup failed with a network error, or
  //  (b) no usable session, but supabase-js still holds a persisted one
  //      (it only keeps it when the refresh failed for network reasons).
  const persistedUserId =
    !auth.loading && !auth.session ? getPersistedSessionUserId() : null
  const unreachable =
    !auth.loading &&
    ((auth.session !== null && auth.rolesErrorNetwork) ||
      (auth.session === null && persistedUserId !== null))
  const offlineUserId = sessionUserId ?? persistedUserId

  const marker = unreachable ? readTvAccessMarker() : null
  const offlineSnapshotAllowed =
    unreachable &&
    offlineUserId !== null &&
    marker?.userId === offlineUserId &&
    hasTvSnapshot()

  const onlineNoRole =
    !auth.loading &&
    auth.session !== null &&
    auth.rolesError === null &&
    auth.roles.length === 0

  const { reloadRoles } = auth

  // While unreachable, keep re-running the REAL checks (session refresh
  // and role lookup) until Supabase answers.
  useEffect(() => {
    if (!unreachable) {
      return
    }

    const retry = () => {
      void getSupabase()
        .auth.getSession()
        .finally(() => reloadRoles())
    }

    const timer = window.setInterval(retry, OFFLINE_RETRY_MS)
    window.addEventListener("online", retry)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener("online", retry)
    }
  }, [unreachable, reloadRoles])

  // Server confirmed this account has no valid role: forget the device's
  // TV authorization and cached content.
  useEffect(() => {
    if (onlineNoRole) {
      clearTvDeviceCache()
    }
  }, [onlineNoRole])

  const { signOut } = auth
  const signOutAndClear = useCallback(async () => {
    clearTvDeviceCache()
    await signOut()
  }, [signOut])

  if (auth.configError) {
    return <GateMessage title={auth.configError} canvas={TV_CANVAS} />
  }

  // Plain canvas until session + roles are known — no content flash.
  if (auth.loading) {
    return <div className={`min-h-screen ${TV_CANVAS}`} />
  }

  // Offline boot from this device's verified snapshot (read-only).
  if (offlineSnapshotAllowed) {
    return (
      <StoreGate surface="tv">
        <Slideshow />
        <TvSignOutShortcut />
      </StoreGate>
    )
  }

  if (!auth.session) {
    return <TvLoginPage />
  }

  if (auth.rolesError) {
    return (
      <GateMessage
        title={auth.rolesError}
        onRetry={auth.reloadRoles}
        onSignOut={signOutAndClear}
        canvas={TV_CANVAS}
      />
    )
  }

  if (auth.roles.length === 0) {
    return (
      <GateMessage
        title="Bu hisob TV ekranini ko‘rish huquqiga ega emas"
        detail={auth.user?.email ?? undefined}
        onSignOut={signOutAndClear}
        canvas={TV_CANVAS}
      />
    )
  }

  return <AuthorizedTv userId={sessionUserId!} roles={auth.roles} />
}

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js"

import type { Database } from "@/types/database"

export type TvSupabaseClient = SupabaseClient<Database>

// Browser Supabase client.
//
// Uses ONLY the publishable key: it is safe to ship to the browser because
// every table is protected by Row Level Security. The service_role / secret
// key must never appear in frontend code or in any VITE_* variable.
//
// The client is created lazily, so the app keeps working on the local
// backend (VITE_DATA_BACKEND=local) even when these variables are not set.

let client: TvSupabaseClient | null = null

/**
 * Private media must never land in the browser's HTTP cache: a cached
 * response could otherwise be served to a later, signed-out request in the
 * same browser. Storage object requests are fetched with "no-store"; the
 * app keeps images in memory (blob URLs) instead.
 */
const privateStorageFetch: typeof fetch = (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url

  if (url.includes("/storage/v1/object/") || url.includes("dashboard")) {
    return fetch(input, { ...init, cache: "no-store" })
  }

  return fetch(input, init)
}

function requireEnv(
  name: string,
  value: string | undefined
): string {
  if (!value) {
    throw new Error(
      `[supabase] Missing ${name}. Copy .env.example to .env.local and set the Supabase project URL and publishable key, then restart the dev server.`
    )
  }

  return value
}

export function getSupabase(): TvSupabaseClient {
  if (client) {
    return client
  }

  // Static property access so Vite can inline the values at build time.
  const url = requireEnv(
    "VITE_SUPABASE_URL",
    import.meta.env.VITE_SUPABASE_URL
  )
  const publishableKey = requireEnv(
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  )

  if (
    publishableKey.startsWith("sb_secret_") ||
    publishableKey.includes("service_role")
  ) {
    throw new Error(
      "[supabase] VITE_SUPABASE_PUBLISHABLE_KEY looks like a secret/service_role key. Use the publishable key only."
    )
  }

  const dashboardAdmin = ['/dashboard-admin','/dashboard/admin'].includes(window.location.pathname)
  const director = !dashboardAdmin && window.location.pathname.startsWith("/dashboard")
  const admin = window.location.pathname.startsWith("/admin") || dashboardAdmin || director
  client = createClient<Database>(url, publishableKey, {
    auth: {
      persistSession: admin,
      autoRefreshToken: admin,
      detectSessionInUrl: admin,
      // TV requests never inherit an old TV/admin login from this browser.
      ...(dashboardAdmin ? {storageKey:"youth-tv-dashboard-editor",storage:window.sessionStorage} : director ? {storageKey: "youth-tv-director",storage: window.sessionStorage} : admin ? {} : { storageKey: "youth-tv-public" }),
    },
    global: {
      fetch: privateStorageFetch,
    },
  })

  return client
}

/**
 * READ-ONLY: the user id of the session supabase-js has persisted in this
 * browser (its default "sb-<project-ref>-auth-token" key), or null.
 *
 * Needed for offline boot: when the stored access token has expired and
 * cannot be refreshed without network, supabase-js reports no session but
 * keeps the stored one. supabase-js removes this key on sign-out and when
 * the server rejects the refresh token. Never writes; never returns tokens.
 */
export function getPersistedSessionUserId(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL

  if (!url) {
    return null
  }

  try {
    const ref = new URL(url).hostname.split(".")[0]
    const raw = localStorage.getItem(`sb-${ref}-auth-token`)
    const parsed = raw ? (JSON.parse(raw) as { user?: { id?: unknown } }) : null
    const id = parsed?.user?.id

    return typeof id === "string" ? id : null
  } catch {
    return null
  }
}

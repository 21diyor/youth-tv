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

  client = createClient<Database>(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return client
}

import type { TvDataAdapter } from "@/data/tvTypes"

// PLACEHOLDER — Supabase is not connected yet.
//
// Planned (see supabase/README.md):
//   - read(key, "published") / read(key, "draft") from an in-memory cache
//     loaded before first render (status = 'published' / 'draft' rows)
//   - saveDraft() updates the draft row only
//   - publish() calls the publish_<type>() RPC
//   - subscribe() is driven by a realtime channel filtered to
//     status=eq.published, with a refetch on reconnect
//
// Until then this adapter behaves as an empty, read-only backend:
// the TV shows the defaults from tvData.ts and saves are rejected.

const notConnected = () =>
  new Error(
    "Supabase hali ulanmagan. VITE_DATA_BACKEND=local dan foydalaning."
  )

export const supabaseAdapter: TvDataAdapter = {
  name: "supabase",

  read() {
    return null
  },

  async saveDraft() {
    throw notConnected()
  },

  async publish() {
    throw notConnected()
  },

  subscribe() {
    return () => {}
  },
}

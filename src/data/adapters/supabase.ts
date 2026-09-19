import type { TvDataAdapter } from "@/data/tvTypes"

// PLACEHOLDER — Supabase is not connected yet.
//
// Planned for the next migration steps:
//   - load the *published* rows of president / appeals / employee /
//     slide settings into an in-memory cache before first render
//   - read() returns from that cache (synchronous, like the local adapter)
//   - write() updates the *draft* row; publishing is a separate action
//   - subscribe() is driven by a single realtime channel on the published
//     tables, with a refetch on reconnect
//
// Until then this adapter behaves as an empty, read-only backend:
// the TV shows the defaults from tvData.ts and saves are rejected.

export const supabaseAdapter: TvDataAdapter = {
  name: "supabase",

  read() {
    return null
  },

  async write() {
    throw new Error(
      "Supabase hali ulanmagan. VITE_DATA_BACKEND=local dan foydalaning."
    )
  },

  subscribe() {
    return () => {}
  },
}

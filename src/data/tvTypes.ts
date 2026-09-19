// Content shapes shared by the store, the persistence adapters and the UI.
// Components keep importing these from "@/data/tvStore", which re-exports them.

export type PresidentContent = {
  name: string
  position: string
  quote: string
  sourceDate: string
  /** tv-media storage path (Supabase only); null/absent = bundled portrait. */
  portraitPath?: string | null
}

export type EmployeeContent = {
  month: string
  year: number
  name: string
  position: string
  department: string
  recognition: string
  achievements: string[]
  /** tv-media storage path (Supabase only); null/absent = placeholder. */
  photoPath?: string | null
}

export type AppealsContent = {
  total: number
  resolved: number
  inProgress: number
  overdue: number

  trend: {
    month: string
    appeals: number
  }[]

  categories: {
    category: string
    appeals: number
  }[]

  regions: {
    region: string
    appeals: number
  }[]
}

export type SlideSettings = {
  intervalSeconds: number
  presidentEnabled: boolean
  appealsEnabled: boolean
  employeeEnabled: boolean
}

export type TvContentMap = {
  president: PresidentContent
  employee: EmployeeContent
  appeals: AppealsContent
  settings: SlideSettings
}

export type TvContentKey = keyof TvContentMap

/** "published" is what the TVs show; "draft" is what admins edit. */
export type ContentVersion = "draft" | "published"

/** Which part of the app is running: the TV slideshow or the admin panel. */
export type TvSurface = "tv" | "admin"

export type TvInitResult = {
  /**
   * "local"    — localStorage backend (always ready)
   * "network"  — loaded from Supabase
   * "snapshot" — TV only: Supabase unreachable, showing the last published
   *              snapshot saved on this device (read-only, not authoritative)
   */
  source: "local" | "network" | "snapshot"
}

/** Timestamps from the backend, when it has them (null for local). */
export type ContentMeta = {
  draftUpdatedAt: string | null
  publishedAt: string | null
}

// ======================================================
// PERSISTENCE ADAPTER CONTRACT
// ======================================================

export interface TvDataAdapter {
  readonly name: "local" | "supabase"

  /**
   * Load what `surface` needs before the first render. After it resolves,
   * read() is synchronous. Rejects with an Error whose message is safe to
   * show when nothing usable could be loaded.
   */
  init(surface: TvSurface): Promise<TvInitResult>

  /** True when read() can be used without awaiting init(). */
  isReady(surface: TvSurface): boolean

  /** Forget user-specific data (drafts) so the next admin init reloads. */
  invalidate(): void

  /**
   * Return the stored value of one version, or null when that version is
   * not available (the store then falls back: draft → published →
   * tvData.ts defaults).
   */
  read<K extends TvContentKey>(
    key: K,
    version: ContentVersion
  ): TvContentMap[K] | null

  readMeta(key: TvContentKey): ContentMeta

  /**
   * Save the draft only. Never changes published content and never
   * notifies TV subscribers. Rejects with an admin-safe Error message.
   */
  saveDraft<K extends TvContentKey>(
    key: K,
    value: TvContentMap[K]
  ): Promise<void>

  /**
   * Copy the saved draft into the published version. Rejects with an
   * admin-safe Error message; on failure published content is unchanged.
   */
  publish(key: TvContentKey): Promise<void>

  /**
   * Report changes to PUBLISHED content (another tab for local, realtime
   * for Supabase). Only fires when the content actually changed; draft
   * changes are never reported. Returns an unsubscribe function.
   */
  subscribePublished(onChange: (key: TvContentKey) => void): () => void
}

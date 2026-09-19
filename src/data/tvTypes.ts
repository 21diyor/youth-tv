// Content shapes shared by the store, the persistence adapters and the UI.
// Components keep importing these from "@/data/tvStore", which re-exports them.

export type PresidentContent = {
  name: string
  position: string
  quote: string
  sourceDate: string
}

export type EmployeeContent = {
  month: string
  year: number
  name: string
  position: string
  department: string
  recognition: string
  achievements: string[]
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

// ======================================================
// PERSISTENCE ADAPTER CONTRACT
// ======================================================

export interface TvDataAdapter {
  readonly name: "local" | "supabase"

  /**
   * Return the stored value of one version, or null when that version has
   * never been stored (the store then falls back: draft → published →
   * tvData.ts defaults).
   */
  read<K extends TvContentKey>(
    key: K,
    version: ContentVersion
  ): TvContentMap[K] | null

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
   * Report PUBLISHED changes made outside this browser tab (another tab
   * today, realtime later). Draft changes are never reported.
   * Returns an unsubscribe function.
   */
  subscribe(onChange: (key: TvContentKey) => void): () => void
}

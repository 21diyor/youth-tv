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

// ======================================================
// PERSISTENCE ADAPTER CONTRACT
// ======================================================

export interface TvDataAdapter {
  readonly name: "local" | "supabase"

  /**
   * Return the currently persisted value, or null when nothing is stored
   * (the store then falls back to the defaults in tvData.ts).
   */
  read<K extends TvContentKey>(key: K): TvContentMap[K] | null

  /**
   * Persist a value. Resolves once saved; rejects with an Error whose
   * message is safe to show to the admin.
   */
  write<K extends TvContentKey>(
    key: K,
    value: TvContentMap[K]
  ): Promise<void>

  /**
   * Report keys changed outside this browser tab (another tab today,
   * realtime later). Returns an unsubscribe function.
   */
  subscribe(onChange: (key: TvContentKey) => void): () => void
}

import type {
  ContentVersion,
  TvContentKey,
  TvContentMap,
  TvDataAdapter,
} from "@/data/tvTypes"

// Published keys are unchanged from the original prototype: they hold the
// content the TVs are showing right now, so existing browsers keep working.
export const localStorageKeys = {
  schedule: "youth-tv-schedule-content",
  managers: "youth-tv-managers-content",
  birthday: "youth-tv-birthday-content",
  president: "youth-tv-president-content",
  employee: "youth-tv-employee-content",
  appeals: "youth-tv-appeals-content",
  settings: "youth-tv-slide-settings",
} as const satisfies Record<TvContentKey, string>

// Draft keys are new. Absent until an admin first presses "Saqlash".
export const localDraftStorageKeys = {
  schedule: "youth-tv-schedule-draft",
  managers: "youth-tv-managers-draft",
  birthday: "youth-tv-birthday-draft",
  president: "youth-tv-president-draft",
  employee: "youth-tv-employee-draft",
  appeals: "youth-tv-appeals-draft",
  settings: "youth-tv-slide-settings-draft",
} as const satisfies Record<TvContentKey, string>

function storageKeyFor(
  key: TvContentKey,
  version: ContentVersion
) {
  return version === "published"
    ? localStorageKeys[key]
    : localDraftStorageKeys[key]
}

// Only published keys map back to a content key, so draft saves in another
// tab are ignored by TV subscribers.
function publishedKeyForStorageKey(
  storageKey: string | null
): TvContentKey | null {
  const entry = Object.entries(localStorageKeys).find(
    ([, value]) => value === storageKey
  )

  return entry ? (entry[0] as TvContentKey) : null
}

function readRaw(storageKey: string) {
  const saved = localStorage.getItem(storageKey)

  if (!saved) {
    return null
  }

  try {
    return JSON.parse(saved) as unknown
  } catch {
    return null
  }
}

export const localAdapter: TvDataAdapter = {
  name: "local",

  // localStorage is synchronous: nothing to load, always ready.
  async init() {
    return { source: "local" }
  },

  isReady() {
    return true
  },

  invalidate() {
    // Nothing is cached in memory.
  },

  readMeta() {
    return { draftUpdatedAt: null, publishedAt: null }
  },

  read<K extends TvContentKey>(key: K, version: ContentVersion) {
    return readRaw(storageKeyFor(key, version)) as
      | TvContentMap[K]
      | null
  },

  async saveDraft(key, value) {
    try {
      localStorage.setItem(
        localDraftStorageKeys[key],
        JSON.stringify(value)
      )
    } catch {
      throw new Error(
        "Ma’lumotni saqlab bo‘lmadi: brauzer xotirasi mavjud emas yoki to‘lgan."
      )
    }
  },

  async publish(key) {
    // Copy the stored draft string verbatim, so published === draft.
    const draft = localStorage.getItem(localDraftStorageKeys[key])

    if (!draft) {
      throw new Error(
        "E’lon qilish uchun saqlangan qoralama topilmadi. Avval saqlang."
      )
    }

    try {
      localStorage.setItem(localStorageKeys[key], draft)
    } catch {
      throw new Error(
        "E’lon qilib bo‘lmadi: brauzer xotirasi mavjud emas yoki to‘lgan. TV ekranidagi ma’lumot o‘zgarmadi."
      )
    }
  },

  // The browser "storage" event fires only in *other* tabs of the same
  // browser profile, and only when the value actually changed — exactly
  // the prototype's original sync behavior.
  subscribePublished(onChange) {
    const handleStorage = (event: StorageEvent) => {
      const key = publishedKeyForStorageKey(event.key)

      if (key) {
        onChange(key)
      }
    }

    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener("storage", handleStorage)
    }
  },
}

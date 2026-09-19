import type {
  TvContentKey,
  TvContentMap,
  TvDataAdapter,
} from "@/data/tvTypes"

// Keys are unchanged from the original prototype so content that is
// already saved in a browser keeps loading after this refactor.
export const localStorageKeys = {
  president: "youth-tv-president-content",
  employee: "youth-tv-employee-content",
  appeals: "youth-tv-appeals-content",
  settings: "youth-tv-slide-settings",
} as const satisfies Record<TvContentKey, string>

function keyForStorageKey(
  storageKey: string | null
): TvContentKey | null {
  const entry = Object.entries(localStorageKeys).find(
    ([, value]) => value === storageKey
  )

  return entry ? (entry[0] as TvContentKey) : null
}

export const localAdapter: TvDataAdapter = {
  name: "local",

  read<K extends TvContentKey>(key: K) {
    const saved = localStorage.getItem(localStorageKeys[key])

    if (!saved) {
      return null
    }

    try {
      return JSON.parse(saved) as TvContentMap[K]
    } catch {
      return null
    }
  },

  async write(key, value) {
    try {
      localStorage.setItem(
        localStorageKeys[key],
        JSON.stringify(value)
      )
    } catch {
      throw new Error(
        "Ma’lumotni saqlab bo‘lmadi: brauzer xotirasi mavjud emas yoki to‘lgan."
      )
    }
  },

  // The browser "storage" event fires only in *other* tabs of the same
  // browser profile — exactly the prototype's original sync behavior.
  subscribe(onChange) {
    const handleStorage = (event: StorageEvent) => {
      const key = keyForStorageKey(event.key)

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

import type {
  PostgrestError,
  RealtimeChannel,
} from "@supabase/supabase-js"

import { getSupabase } from "@/lib/supabase"

import { isSameContent } from "@/data/contentEquality"
import {
  CONTENT_KEYS,
  CONTENT_TABLES,
  callPublish,
  contentKeyForTable,
  mapRow,
  selectRow,
  updateDraftRow,
  type MappedRow,
} from "@/data/adapters/supabaseRows"
import type {
  ContentMeta,
  ContentVersion,
  TvContentKey,
  TvContentMap,
  TvDataAdapter,
  TvInitResult,
  TvSurface,
} from "@/data/tvTypes"

// ======================================================
// CONFIG
// ======================================================

/** Read-only offline copy of PUBLISHED content for TVs (not the live keys). */
const SNAPSHOT_KEY = "youth-tv-supabase-published-snapshot-v1"

const SAFETY_REFETCH_MS = 30 * 1000

// ======================================================
// IN-MEMORY CACHE
// ======================================================

type VersionCache = Partial<{ [K in TvContentKey]: TvContentMap[K] }>

const cache: Record<ContentVersion, VersionCache> = {
  published: {},
  draft: {},
}

const meta: Record<TvContentKey, ContentMeta> = {
  president: { draftUpdatedAt: null, publishedAt: null },
  appeals: { draftUpdatedAt: null, publishedAt: null },
  employee: { draftUpdatedAt: null, publishedAt: null },
  settings: { draftUpdatedAt: null, publishedAt: null },
}

const listeners = new Set<(key: TvContentKey) => void>()

const readySurfaces = new Set<TvSurface>()
const initPromises = new Map<TvSurface, Promise<TvInitResult>>()

// ======================================================
// ERRORS → ADMIN/TV-SAFE UZBEK MESSAGES
// ======================================================

const NETWORK_MESSAGE =
  "Serverga ulanib bo‘lmadi. Internet aloqasini tekshiring."

function isNetworkError(error: PostgrestError | Error): boolean {
  const code = "code" in error ? error.code : ""
  return !code && /fetch|network|load failed/i.test(error.message)
}

function isSessionError(error: PostgrestError): boolean {
  return (
    error.code === "PGRST301" ||
    error.code === "PGRST303" ||
    /jwt/i.test(error.message)
  )
}

const CHECK_MESSAGES: Record<string, string> = {
  appeals_status_sum_chk:
    "Hal etilgan, jarayonda va muddati o‘tgan murojaatlar yig‘indisi jami murojaatlar soniga teng bo‘lishi kerak.",
  appeals_trend_chk: "Murojaatlar dinamikasi ma’lumotlari noto‘g‘ri.",
  appeals_categories_chk: "Murojaat turlari soni 4 ta bo‘lishi kerak.",
  appeals_regions_chk: "Yetakchi hududlar soni 5 ta bo‘lishi kerak.",
  employee_achievements_chk: "Asosiy natijalar soni 3 ta bo‘lishi kerak.",
  slide_settings_one_enabled_chk: "Kamida bitta slayd faol bo‘lishi kerak.",
}

function checkMessage(error: PostgrestError): string {
  const name = /constraint "([^"]+)"/.exec(error.message)?.[1] ?? ""

  if (CHECK_MESSAGES[name]) {
    return CHECK_MESSAGES[name]
  }

  if (name.includes("interval_seconds")) {
    return "Interval 5–300 soniya oralig‘ida bo‘lishi kerak."
  }

  if (name.includes("year")) {
    return "Yil 2000–2100 oralig‘ida bo‘lishi kerak."
  }

  if (/total|resolved|in_progress|overdue/.test(name)) {
    return "Murojaatlar soni manfiy bo‘lishi mumkin emas."
  }

  return "Kiritilgan ma’lumotlar talablarga mos kelmadi. Qiymatlarni tekshiring."
}

function saveErrorMessage(error: PostgrestError | null): string {
  if (!error) {
    return "Saqlash uchun ruxsat yo‘q: bu bo‘limni tahrirlash huquqingiz mavjud emas."
  }

  if (isNetworkError(error)) {
    return NETWORK_MESSAGE
  }

  if (isSessionError(error)) {
    return "Sessiya muddati tugagan. Sahifani yangilab, qayta kiring."
  }

  switch (error.code) {
    case "42501":
      return "Saqlash uchun ruxsat yo‘q: bu bo‘limni tahrirlash huquqingiz mavjud emas."
    case "23514":
      return checkMessage(error)
    case "23502":
      return "Barcha majburiy maydonlarni to‘ldiring."
    case "22P02":
    case "22003":
      return "Noto‘g‘ri qiymat kiritildi. Raqamli maydonlarni tekshiring."
  }

  return "Saqlashda xatolik yuz berdi. Qayta urinib ko‘ring."
}

function publishErrorMessage(error: PostgrestError | null): string {
  const unchanged = " TV ekranidagi ma’lumot o‘zgarmadi."

  if (error && isNetworkError(error)) {
    return NETWORK_MESSAGE + unchanged
  }

  if (error && isSessionError(error)) {
    return "Sessiya muddati tugagan. Sahifani yangilab, qayta kiring." + unchanged
  }

  if (!error || error.code === "42501") {
    return "E’lon qilish uchun ruxsat yo‘q." + unchanged
  }

  if (error.code === "23514") {
    return checkMessage(error) + unchanged
  }

  return "E’lon qilishda xatolik yuz berdi." + unchanged
}

class LoadError extends Error {
  /** True only when Supabase could not be reached at all. */
  readonly network: boolean

  constructor(message: string, network = false) {
    super(message)
    this.network = network
  }
}

function loadError(
  surface: TvSurface,
  error: PostgrestError | null
): LoadError {
  if (error && isNetworkError(error)) {
    return new LoadError(NETWORK_MESSAGE, true)
  }

  if (surface === "tv") {
    return new LoadError(
      "TV ma’lumotlarini yuklab bo‘lmadi. Ulanish avtomatik qayta tekshiriladi."
    )
  }

  return new LoadError(
    "Kontent ma’lumotlarini yuklab bo‘lmadi. Qayta urinib ko‘ring."
  )
}

// ======================================================
// CACHE UPDATES
// ======================================================

function notify(key: TvContentKey) {
  listeners.forEach((listener) => listener(key))
}

/** Store a published row; notify only when the content really changed. */
function applyPublished(
  key: TvContentKey,
  row: MappedRow,
  shouldNotify: boolean
) {
  if (row.status !== "published") {
    return
  }

  const changed = !isSameContent(cache.published[key], row.content)

  ;(cache.published as Record<TvContentKey, unknown>)[key] = row.content
  meta[key] = { ...meta[key], publishedAt: row.publishedAt }

  if (changed && readySurfaces.has("tv")) {
    saveSnapshot()
  }

  if (changed && shouldNotify) {
    notify(key)
  }
}

function applyDraft(key: TvContentKey, row: MappedRow) {
  ;(cache.draft as Record<TvContentKey, unknown>)[key] = row.content
  meta[key] = { ...meta[key], draftUpdatedAt: row.updatedAt }
}

// ======================================================
// LOADING
// ======================================================

/** All four published rows; throws if any is unavailable. */
async function fetchPublished(
  surface: TvSurface
): Promise<Record<TvContentKey, MappedRow>> {
  const results = await Promise.all(
    CONTENT_KEYS.map((key) => selectRow(key, "published"))
  )

  const rows = {} as Record<TvContentKey, MappedRow>

  results.forEach((result, index) => {
    if (!result.row) {
      throw loadError(surface, result.error)
    }

    rows[CONTENT_KEYS[index]] = result.row
  })

  return rows
}

/** Draft rows the user may see (RLS hides the others — that is fine). */
async function fetchDrafts(): Promise<void> {
  const results = await Promise.all(
    CONTENT_KEYS.map((key) => selectRow(key, "draft"))
  )

  results.forEach((result, index) => {
    const key = CONTENT_KEYS[index]

    if (result.error) {
      throw loadError("admin", result.error)
    }

    if (result.row) {
      applyDraft(key, result.row)
    } else {
      delete cache.draft[key]
    }
  })
}

async function refetchPublished(reason: string) {
  try {
    const surface = readySurfaces.has("tv") ? "tv" : "admin"
    const rows = await fetchPublished(surface)

    CONTENT_KEYS.forEach((key) => applyPublished(key, rows[key], true))
    servingSnapshot = false

    // Supabase is reachable again: make sure live updates are wired up.
    if (triggersInstalled) {
      ensureChannel()
    }
  } catch (error) {
    // Keep showing what we have; the next trigger will try again.
    console.warn(`[supabase] published refetch (${reason}) failed`, error)
  }
}

// ======================================================
// OFFLINE SNAPSHOT (TV, published only)
// ======================================================

type Snapshot = {
  version: 1
  savedAt: string
  published: Record<TvContentKey, unknown>
}

/** True while the TV is showing the device snapshot, not live data. */
let servingSnapshot = false

/** A complete, readable published snapshot exists on this device. */
export function hasTvSnapshot(): boolean {
  return loadSnapshot() !== null
}

/** Remove the TV snapshot (deliberate sign-out / device reset). */
export function clearTvSnapshot() {
  try {
    localStorage.removeItem(SNAPSHOT_KEY)
  } catch {
    // Storage unavailable: nothing to clear.
  }
}

function saveSnapshot() {
  if (CONTENT_KEYS.some((key) => cache.published[key] === undefined)) {
    return
  }

  const snapshot: Snapshot = {
    version: 1,
    savedAt: new Date().toISOString(),
    published: { ...(cache.published as Record<TvContentKey, unknown>) },
  }

  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
  } catch {
    // Storage full/unavailable: the snapshot is only a convenience.
  }
}

function loadSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    const snapshot = raw ? (JSON.parse(raw) as Snapshot) : null

    if (
      snapshot?.version === 1 &&
      CONTENT_KEYS.every((key) => snapshot.published?.[key])
    ) {
      return snapshot
    }
  } catch {
    // Corrupt snapshot: ignore it.
  }

  return null
}

// ======================================================
// REALTIME + REFETCH TRIGGERS (one per page, StrictMode-safe)
// ======================================================

let channel: RealtimeChannel | null = null
let triggersInstalled = false

/**
 * The channel still exists in the realtime client. realtime-js closes and
 * REMOVES a channel whose join keeps failing (e.g. a long outage), so a
 * held reference alone does not mean live updates are still wired up.
 */
function channelAlive(): boolean {
  return channel !== null && getSupabase().getChannels().includes(channel)
}

/** Create the single published-content channel if it is missing/dead. */
function ensureChannel() {
  if (channelAlive()) {
    return
  }

  const supabase = getSupabase()
  let next = supabase.channel("tv-published-content")

  for (const key of CONTENT_KEYS) {
    next = next.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: CONTENT_TABLES[key],
        filter: "status=eq.published",
      },
      (payload) => {
        const table = payload.table
        const rowKey = contentKeyForTable(table)
        const row = payload.new as Parameters<typeof mapRow>[1]

        // Belt and braces: the filter and RLS already exclude drafts.
        if (!rowKey || row?.status !== "published") {
          return
        }

        applyPublished(rowKey, mapRow(rowKey, row), true)
      }
    )
  }

  channel = next.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      // Catch updates missed between the HTTP read and any channel join.
      void refetchPublished("subscribed")
    }

    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      console.warn(`[supabase] realtime channel ${status}; will rejoin`)
    }
  })
}

function startLiveUpdates() {
  ensureChannel()

  // Page-lifetime triggers, installed once. Each refetch also repairs the
  // channel if realtime-js removed it.
  if (!triggersInstalled) {
    triggersInstalled = true

    window.addEventListener("online", () => {
      void refetchPublished("online")
    })
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void refetchPublished("visible")
      }
    })

    window.setInterval(() => {
      void refetchPublished("safety interval")
    }, SAFETY_REFETCH_MS)
  }
}

// ======================================================
// INIT
// ======================================================

async function load(surface: TvSurface): Promise<TvInitResult> {
  try {
    const rows = await fetchPublished(surface)

    CONTENT_KEYS.forEach((key) => applyPublished(key, rows[key], false))

    if (surface === "admin") {
      await fetchDrafts()
    }

    readySurfaces.add(surface)

    if (surface === "tv") {
      saveSnapshot()
    }

    startLiveUpdates()

    return { source: "network" }
  } catch (error) {
    // TV: fall back to the last published snapshot on this device — but
    // ONLY when Supabase was unreachable. A real server answer (permission
    // denied, expired session, no role) never unlocks the snapshot.
    const networkFailure =
      error instanceof LoadError ? error.network : error instanceof TypeError

    if (surface === "tv" && networkFailure) {
      const snapshot = loadSnapshot()

      if (snapshot) {
        console.warn("[supabase] using offline published snapshot", error)

        for (const key of CONTENT_KEYS) {
          ;(cache.published as Record<TvContentKey, unknown>)[key] =
            snapshot.published[key]
        }

        servingSnapshot = true
        readySurfaces.add("tv")
        startLiveUpdates()

        return { source: "snapshot" }
      }
    }

    // Admin never edits from a snapshot.
    throw error instanceof LoadError
      ? error
      : loadError(surface, error as PostgrestError)
  }
}

/**
 * After the TV's authorization was revalidated online: if it is still
 * showing the offline snapshot, fetch live published content now instead
 * of waiting for the next reconnect/online/interval trigger.
 */
export function refreshTvIfServingSnapshot(): Promise<void> {
  if (servingSnapshot) {
    return refetchPublished("revalidated")
  }

  if (triggersInstalled) {
    ensureChannel()
  }

  return Promise.resolve()
}

// ======================================================
// ADAPTER
// ======================================================

export const supabaseAdapter: TvDataAdapter = {
  name: "supabase",

  init(surface) {
    // Memoised so React StrictMode / re-renders never load twice.
    let promise = initPromises.get(surface)

    if (!promise) {
      promise = load(surface).catch((error: unknown) => {
        initPromises.delete(surface)
        throw error
      })
      initPromises.set(surface, promise)
    }

    return promise
  },

  isReady(surface) {
    return readySurfaces.has(surface)
  },

  invalidate() {
    // Signed-in user changed: drafts and draft access must be reloaded.
    cache.draft = {}
    readySurfaces.delete("admin")
    initPromises.delete("admin")
  },

  read<K extends TvContentKey>(key: K, version: ContentVersion) {
    return (cache[version][key] as TvContentMap[K] | undefined) ?? null
  },

  readMeta(key) {
    return meta[key]
  },

  async saveDraft(key, value) {
    let result

    try {
      result = await updateDraftRow(key, value)
    } catch {
      throw new Error(NETWORK_MESSAGE)
    }

    if (!result.row) {
      // Error, or RLS let zero rows change → no permission.
      throw new Error(saveErrorMessage(result.error))
    }

    applyDraft(key, result.row)
  },

  async publish(key) {
    let result

    try {
      result = await callPublish(key)
    } catch {
      throw new Error(NETWORK_MESSAGE + " TV ekranidagi ma’lumot o‘zgarmadi.")
    }

    if (!result.row) {
      throw new Error(publishErrorMessage(result.error))
    }

    applyPublished(key, result.row, true)
  },

  subscribePublished(onChange) {
    listeners.add(onChange)

    return () => {
      listeners.delete(onChange)
    }
  },
}

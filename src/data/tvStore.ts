import {
  appealsData,
  employeeOfMonthData,
  presidentSlideData,
} from "@/data/tvData"

import {
  localAdapter,
  localStorageKeys,
} from "@/data/adapters/local"
import { supabaseAdapter } from "@/data/adapters/supabase"

import type {
  AppealsContent,
  EmployeeContent,
  PresidentContent,
  SlideSettings,
  TvContentKey,
  TvContentMap,
  TvDataAdapter,
} from "@/data/tvTypes"

export type {
  AppealsContent,
  ContentVersion,
  EmployeeContent,
  PresidentContent,
  SlideSettings,
  TvContentKey,
  TvContentMap,
} from "@/data/tvTypes"

// ======================================================
// BACKEND SELECTION
// ======================================================

function selectAdapter(): TvDataAdapter {
  const backend = import.meta.env.VITE_DATA_BACKEND ?? "local"

  if (backend === "supabase") {
    console.warn(
      "[tvStore] VITE_DATA_BACKEND=supabase: Supabase adapter is a placeholder and is not connected yet."
    )

    return supabaseAdapter
  }

  return localAdapter
}

const adapter = selectAdapter()

// ======================================================
// DEFAULTS
// ======================================================

const defaultSlideSettings: SlideSettings = {
  intervalSeconds: 12,
  presidentEnabled: true,
  appealsEnabled: true,
  employeeEnabled: true,
}

const defaults: TvContentMap = {
  president: presidentSlideData,
  employee: employeeOfMonthData,
  appeals: appealsData,
  settings: defaultSlideSettings,
}

// ======================================================
// GENERIC ACCESS
// ======================================================

/** Live content shown on the TVs (falls back to tvData.ts defaults). */
export function getPublished<K extends TvContentKey>(
  key: K
): TvContentMap[K] {
  return adapter.read(key, "published") ?? defaults[key]
}

/**
 * Content being edited in the admin panel. Until the first "Saqlash" there
 * is no stored draft, so the draft starts as the published value — nothing
 * is written just because an editor was opened.
 */
export function getDraft<K extends TvContentKey>(
  key: K
): TvContentMap[K] {
  return adapter.read(key, "draft") ?? getPublished(key)
}

/** Save the draft only. Does not change the TVs. */
export function saveDraft<K extends TvContentKey>(
  key: K,
  data: TvContentMap[K]
): Promise<void> {
  return adapter.saveDraft(key, data)
}

/** Copy the saved draft to the TVs. */
export function publish(key: TvContentKey): Promise<void> {
  return adapter.publish(key)
}

export type PublishState = {
  hasUnpublishedChanges: boolean
}

export function getPublishState(key: TvContentKey): PublishState {
  const draft = adapter.read(key, "draft")

  return {
    hasUnpublishedChanges:
      draft !== null &&
      !isSameContent(draft, getPublished(key)),
  }
}

/** Structural equality for content objects (key order independent). */
export function isSameContent(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true
  }

  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return false
  }

  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)

  if (aKeys.length !== bKeys.length) {
    return false
  }

  return aKeys.every((key) =>
    isSameContent(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key]
    )
  )
}

// ======================================================
// SUBSCRIPTIONS (published content only)
// ======================================================

type Listener = () => void

const listeners = new Map<TvContentKey, Set<Listener>>()

let detachAdapter: (() => void) | null = null

function notify(key: TvContentKey) {
  listeners.get(key)?.forEach((listener) => listener())
}

function listenerCount() {
  let count = 0

  listeners.forEach((set) => {
    count += set.size
  })

  return count
}

/**
 * Run `listener` whenever the PUBLISHED value for `key` changes outside
 * this tab. Draft saves never trigger it. Read the new value with the
 * matching published getter.
 * Returns an unsubscribe function (usable directly as an effect cleanup).
 */
export function subscribe(
  key: TvContentKey,
  listener: Listener
): () => void {
  let keyListeners = listeners.get(key)

  if (!keyListeners) {
    keyListeners = new Set()
    listeners.set(key, keyListeners)
  }

  keyListeners.add(listener)

  if (!detachAdapter) {
    detachAdapter = adapter.subscribe(notify)
  }

  return () => {
    keyListeners.delete(listener)

    if (listenerCount() === 0 && detachAdapter) {
      detachAdapter()
      detachAdapter = null
    }
  }
}

// ======================================================
// ERRORS
// ======================================================

export function getSaveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Saqlashda xatolik yuz berdi. Qayta urinib ko‘ring."
}

export function getPublishErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return "E’lon qilishda xatolik yuz berdi. TV ekranidagi ma’lumot o‘zgarmadi."
}

// ======================================================
// PRESIDENT
// ======================================================

export function getPresidentContent(): PresidentContent {
  return getPublished("president")
}

export function getPresidentDraft(): PresidentContent {
  return getDraft("president")
}

export function savePresidentDraft(
  data: PresidentContent
): Promise<void> {
  return saveDraft("president", data)
}

export function publishPresidentContent(): Promise<void> {
  return publish("president")
}

/** @deprecated Use subscribe("president", …). Kept for compatibility. */
export const presidentStorageKey = localStorageKeys.president

// ======================================================
// EMPLOYEE OF THE MONTH
// ======================================================

export function getEmployeeContent(): EmployeeContent {
  return getPublished("employee")
}

export function getEmployeeDraft(): EmployeeContent {
  return getDraft("employee")
}

export function saveEmployeeDraft(
  data: EmployeeContent
): Promise<void> {
  return saveDraft("employee", data)
}

export function publishEmployeeContent(): Promise<void> {
  return publish("employee")
}

/** @deprecated Use subscribe("employee", …). Kept for compatibility. */
export const employeeStorageKey = localStorageKeys.employee

// ======================================================
// CITIZEN APPEALS
// ======================================================

export function getAppealsContent(): AppealsContent {
  return getPublished("appeals")
}

export function getAppealsDraft(): AppealsContent {
  return getDraft("appeals")
}

export function saveAppealsDraft(
  data: AppealsContent
): Promise<void> {
  return saveDraft("appeals", data)
}

export function publishAppealsContent(): Promise<void> {
  return publish("appeals")
}

/** @deprecated Use subscribe("appeals", …). Kept for compatibility. */
export const appealsStorageKey = localStorageKeys.appeals

// ======================================================
// SLIDESHOW SETTINGS
// ======================================================

export function getSlideSettings(): SlideSettings {
  return getPublished("settings")
}

export function getSlideSettingsDraft(): SlideSettings {
  return getDraft("settings")
}

export function saveSlideSettingsDraft(
  data: SlideSettings
): Promise<void> {
  return saveDraft("settings", data)
}

export function publishSlideSettings(): Promise<void> {
  return publish("settings")
}

/** @deprecated Use subscribe("settings", …). Kept for compatibility. */
export const slideSettingsStorageKey = localStorageKeys.settings

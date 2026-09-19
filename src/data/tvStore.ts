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
  TvDataAdapter,
} from "@/data/tvTypes"

export type {
  AppealsContent,
  EmployeeContent,
  PresidentContent,
  SlideSettings,
  TvContentKey,
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
// SUBSCRIPTIONS
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
 * Run `listener` whenever the persisted value for `key` changes outside
 * this tab. Read the new value with the matching getter.
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

// ======================================================
// PRESIDENT
// ======================================================

export function getPresidentContent(): PresidentContent {
  return adapter.read("president") ?? presidentSlideData
}

export function savePresidentContent(
  data: PresidentContent
): Promise<void> {
  return adapter.write("president", data)
}

/** @deprecated Use subscribe("president", …). Kept for compatibility. */
export const presidentStorageKey = localStorageKeys.president

// ======================================================
// EMPLOYEE OF THE MONTH
// ======================================================

export function getEmployeeContent(): EmployeeContent {
  return adapter.read("employee") ?? employeeOfMonthData
}

export function saveEmployeeContent(
  data: EmployeeContent
): Promise<void> {
  return adapter.write("employee", data)
}

/** @deprecated Use subscribe("employee", …). Kept for compatibility. */
export const employeeStorageKey = localStorageKeys.employee

// ======================================================
// CITIZEN APPEALS
// ======================================================

export function getAppealsContent(): AppealsContent {
  return adapter.read("appeals") ?? appealsData
}

export function saveAppealsContent(
  data: AppealsContent
): Promise<void> {
  return adapter.write("appeals", data)
}

/** @deprecated Use subscribe("appeals", …). Kept for compatibility. */
export const appealsStorageKey = localStorageKeys.appeals

// ======================================================
// SLIDESHOW SETTINGS
// ======================================================

const defaultSlideSettings: SlideSettings = {
  intervalSeconds: 12,
  presidentEnabled: true,
  appealsEnabled: true,
  employeeEnabled: true,
}

export function getSlideSettings(): SlideSettings {
  return adapter.read("settings") ?? defaultSlideSettings
}

export function saveSlideSettings(
  data: SlideSettings
): Promise<void> {
  return adapter.write("settings", data)
}

/** @deprecated Use subscribe("settings", …). Kept for compatibility. */
export const slideSettingsStorageKey = localStorageKeys.settings

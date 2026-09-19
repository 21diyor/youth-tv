import type { PostgrestError } from "@supabase/supabase-js"

import { getSupabase } from "@/lib/supabase"

import type {
  AppealsContent,
  ContentVersion,
  EmployeeContent,
  PresidentContent,
  SlideSettings,
  TvContentKey,
  TvContentMap,
} from "@/data/tvTypes"
import type { Json, Tables } from "@/types/database"

// Row ↔ content mapping and the per-table Supabase calls. Everything that
// knows about snake_case columns lives here; the rest of the app only sees
// the camelCase shapes from tvTypes.ts.

export const CONTENT_KEYS: readonly TvContentKey[] = [
  "president",
  "appeals",
  "employee",
  "settings",
]

export const CONTENT_TABLES = {
  president: "president_content",
  appeals: "appeals_content",
  employee: "employee_content",
  settings: "slide_settings",
} as const satisfies Record<TvContentKey, string>

export function contentKeyForTable(table: string): TvContentKey | null {
  const entry = Object.entries(CONTENT_TABLES).find(
    ([, name]) => name === table
  )

  return entry ? (entry[0] as TvContentKey) : null
}

type PresidentRow = Tables<"president_content">
type AppealsRow = Tables<"appeals_content">
type EmployeeRow = Tables<"employee_content">
type SettingsRow = Tables<"slide_settings">

type AnyContentRow = PresidentRow | AppealsRow | EmployeeRow | SettingsRow

/** A mapped row: component-facing content plus backend timestamps. */
export type MappedRow<K extends TvContentKey = TvContentKey> = {
  status: ContentVersion
  content: TvContentMap[K]
  updatedAt: string
  publishedAt: string | null
}

export type RowResult =
  | { row: MappedRow; error: null }
  | { row: null; error: PostgrestError | null }

// ======================================================
// MAPPING
// ======================================================

function asArray<T>(value: Json): T[] {
  return Array.isArray(value) ? (value as unknown as T[]) : []
}

function toPresident(row: PresidentRow): PresidentContent {
  return {
    name: row.name,
    position: row.position,
    quote: row.quote,
    sourceDate: row.source_date,
  }
}

function toAppeals(row: AppealsRow): AppealsContent {
  return {
    total: row.total,
    resolved: row.resolved,
    inProgress: row.in_progress,
    overdue: row.overdue,
    trend: asArray<AppealsContent["trend"][number]>(row.trend),
    categories: asArray<AppealsContent["categories"][number]>(
      row.categories
    ),
    regions: asArray<AppealsContent["regions"][number]>(row.regions),
  }
}

function toEmployee(row: EmployeeRow): EmployeeContent {
  return {
    month: row.month,
    year: row.year,
    name: row.name,
    position: row.position,
    department: row.department,
    recognition: row.recognition,
    achievements: asArray<string>(row.achievements),
  }
}

function toSettings(row: SettingsRow): SlideSettings {
  return {
    intervalSeconds: row.interval_seconds,
    presidentEnabled: row.president_enabled,
    appealsEnabled: row.appeals_enabled,
    employeeEnabled: row.employee_enabled,
  }
}

/** Map any content row (e.g. a realtime payload) for the given key. */
export function mapRow(
  key: TvContentKey,
  row: AnyContentRow
): MappedRow {
  let content: TvContentMap[TvContentKey]

  switch (key) {
    case "president":
      content = toPresident(row as PresidentRow)
      break
    case "appeals":
      content = toAppeals(row as AppealsRow)
      break
    case "employee":
      content = toEmployee(row as EmployeeRow)
      break
    case "settings":
      content = toSettings(row as SettingsRow)
      break
  }

  return {
    status: row.status,
    content,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  }
}

function result(
  key: TvContentKey,
  data: AnyContentRow | null,
  error: PostgrestError | null
): RowResult {
  if (error || !data) {
    return { row: null, error }
  }

  return { row: mapRow(key, data), error: null }
}

// ======================================================
// QUERIES (RLS decides what the signed-in user may see/do)
// ======================================================

/** One row of `version`; row is null when RLS hides it. */
export async function selectRow(
  key: TvContentKey,
  version: ContentVersion
): Promise<RowResult> {
  const supabase = getSupabase()

  switch (key) {
    case "president": {
      const { data, error } = await supabase
        .from("president_content")
        .select("*")
        .eq("status", version)
        .maybeSingle()
      return result(key, data, error)
    }
    case "appeals": {
      const { data, error } = await supabase
        .from("appeals_content")
        .select("*")
        .eq("status", version)
        .maybeSingle()
      return result(key, data, error)
    }
    case "employee": {
      const { data, error } = await supabase
        .from("employee_content")
        .select("*")
        .eq("status", version)
        .maybeSingle()
      return result(key, data, error)
    }
    case "settings": {
      const { data, error } = await supabase
        .from("slide_settings")
        .select("*")
        .eq("status", version)
        .maybeSingle()
      return result(key, data, error)
    }
  }
}

/**
 * Update the DRAFT row with content columns only (never status, image
 * paths or metadata). row is null when RLS allowed zero rows to change.
 */
export async function updateDraftRow<K extends TvContentKey>(
  key: K,
  value: TvContentMap[K]
): Promise<RowResult> {
  const supabase = getSupabase()

  switch (key) {
    case "president": {
      const v = value as PresidentContent
      const { data, error } = await supabase
        .from("president_content")
        .update({
          name: v.name,
          position: v.position,
          quote: v.quote,
          source_date: v.sourceDate,
        })
        .eq("status", "draft")
        .select()
      return result(key, data?.[0] ?? null, error)
    }
    case "appeals": {
      const v = value as AppealsContent
      const { data, error } = await supabase
        .from("appeals_content")
        .update({
          total: v.total,
          resolved: v.resolved,
          in_progress: v.inProgress,
          overdue: v.overdue,
          trend: v.trend as unknown as Json,
          categories: v.categories as unknown as Json,
          regions: v.regions as unknown as Json,
        })
        .eq("status", "draft")
        .select()
      return result(key, data?.[0] ?? null, error)
    }
    case "employee": {
      const v = value as EmployeeContent
      const { data, error } = await supabase
        .from("employee_content")
        .update({
          month: v.month,
          year: v.year,
          name: v.name,
          position: v.position,
          department: v.department,
          recognition: v.recognition,
          achievements: v.achievements as unknown as Json,
        })
        .eq("status", "draft")
        .select()
      return result(key, data?.[0] ?? null, error)
    }
    default: {
      const v = value as SlideSettings
      const { data, error } = await supabase
        .from("slide_settings")
        .update({
          interval_seconds: v.intervalSeconds,
          president_enabled: v.presidentEnabled,
          appeals_enabled: v.appealsEnabled,
          employee_enabled: v.employeeEnabled,
        })
        .eq("status", "draft")
        .select()
      return result(key, data?.[0] ?? null, error)
    }
  }
}

/** Atomic draft → published copy, done by the SECURITY DEFINER RPC. */
export async function callPublish(key: TvContentKey): Promise<RowResult> {
  const supabase = getSupabase()

  switch (key) {
    case "president": {
      const { data, error } = await supabase.rpc("publish_president_content")
      return result(key, data, error)
    }
    case "appeals": {
      const { data, error } = await supabase.rpc("publish_appeals_content")
      return result(key, data, error)
    }
    case "employee": {
      const { data, error } = await supabase.rpc("publish_employee_content")
      return result(key, data, error)
    }
    case "settings": {
      const { data, error } = await supabase.rpc("publish_slide_settings")
      return result(key, data, error)
    }
  }
}

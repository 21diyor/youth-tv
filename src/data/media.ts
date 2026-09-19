import { useEffect, useState } from "react"

import { getSupabase } from "@/lib/supabase"

import { tvBackend } from "@/data/tvStore"

// Private "tv-media" bucket (migration 000002). Files are immutable: every
// upload gets a new <folder>/<uuid>.<ext> path. The path is then stored in
// the DRAFT row by the normal "Saqlash"; publishing copies it to the TVs.
// Old files are never deleted automatically.

const BUCKET = "tv-media"
const MAX_BYTES = 5 * 1024 * 1024

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export const ACCEPTED_IMAGE_TYPES = Object.keys(EXTENSIONS).join(",")

export const IMAGE_HINT = "JPG, PNG yoki WEBP · maksimal 5 MB"

/** Admin-safe validation message, or null when the file is acceptable. */
export function validateImageFile(file: File): string | null {
  if (!EXTENSIONS[file.type]) {
    return "Faqat JPG, PNG yoki WEBP rasm yuklash mumkin."
  }

  if (file.size > MAX_BYTES) {
    return "Rasm hajmi 5 MB dan oshmasligi kerak."
  }

  if (file.size === 0) {
    return "Rasm fayli bo‘sh."
  }

  return null
}

function uploadErrorMessage(error: { message?: string; statusCode?: string | number }) {
  const status = String(error.statusCode ?? "")
  const message = error.message ?? ""

  if (/row-level security|unauthorized|403/i.test(message) || status === "403") {
    return "Rasm yuklash uchun ruxsat yo‘q."
  }

  if (status === "413" || /too large|size/i.test(message)) {
    return "Rasm hajmi 5 MB dan oshmasligi kerak."
  }

  if (status === "415" || /mime|type/i.test(message)) {
    return "Faqat JPG, PNG yoki WEBP rasm yuklash mumkin."
  }

  if (/fetch|network|load failed/i.test(message)) {
    return "Serverga ulanib bo‘lmadi. Internet aloqasini tekshiring."
  }

  return "Rasmni yuklab bo‘lmadi. Qayta urinib ko‘ring."
}

async function upload(folder: "president" | "employee", file: File) {
  if (tvBackend !== "supabase") {
    throw new Error("Rasm yuklash faqat Supabase rejimida ishlaydi.")
  }

  const invalid = validateImageFile(file)

  if (invalid) {
    throw new Error(invalid)
  }

  const path = `${folder}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`

  let result

  try {
    result = await getSupabase()
      .storage.from(BUCKET)
      .upload(path, file, {
        upsert: false, // never overwrite
        contentType: file.type,
        // Private files: tell any cache not to keep them (see supabase.ts).
        cacheControl: "0",
      })
  } catch {
    throw new Error("Serverga ulanib bo‘lmadi. Internet aloqasini tekshiring.")
  }

  if (result.error) {
    throw new Error(uploadErrorMessage(result.error as never))
  }

  return result.data.path
}

/** Upload a new President portrait; returns its storage path. */
export function uploadPresidentPortrait(file: File): Promise<string> {
  return upload("president", file)
}

/** Upload a new Employee of the Month photo; returns its storage path. */
export function uploadEmployeePhoto(file: File): Promise<string> {
  return upload("employee", file)
}

// ======================================================
// AUTHENTICATED IMAGE LOADING (private bucket → blob URL)
// ======================================================

const MAX_CACHED = 12
const urlCache = new Map<string, Promise<string>>()

function remember(path: string, promise: Promise<string>) {
  urlCache.set(path, promise)

  // Keep the cache small; release the oldest blob URLs.
  while (urlCache.size > MAX_CACHED) {
    const [oldestPath, oldest] = urlCache.entries().next().value as [
      string,
      Promise<string>,
    ]
    urlCache.delete(oldestPath)
    void oldest.then((url) => URL.revokeObjectURL(url)).catch(() => {})
  }
}

/**
 * Object URL for a tv-media path, downloaded with the signed-in user's
 * session (RLS decides: editors see drafts, TVs only published images).
 */
export function loadMediaUrl(path: string): Promise<string> {
  const cached = urlCache.get(path)

  if (cached) {
    return cached
  }

  const promise = getSupabase()
    .storage.from(BUCKET)
    .download(path)
    .then(({ data, error }) => {
      if (error || !data) {
        throw error ?? new Error("Rasm topilmadi")
      }

      return URL.createObjectURL(data)
    })

  remember(path, promise)

  // Do not cache failures (offline, not yet published, …): retry later.
  promise.catch(() => {
    if (urlCache.get(path) === promise) {
      urlCache.delete(path)
    }
  })

  return promise
}

type MediaState = {
  path: string | null
  url: string | null
  failed: boolean
}

/**
 * React hook: blob URL for `path`, or null. `loading` is true while the
 * current path is being fetched; `failed` when it could not be loaded.
 */
export function useMediaUrl(path: string | null | undefined) {
  const wanted = tvBackend === "supabase" && path ? path : null

  const [state, setState] = useState<MediaState>({
    path: null,
    url: null,
    failed: false,
  })

  useEffect(() => {
    if (!wanted) {
      return
    }

    let cancelled = false

    loadMediaUrl(wanted).then(
      (url) => {
        if (!cancelled) {
          setState({ path: wanted, url, failed: false })
        }
      },
      (error: unknown) => {
        console.warn("[media] could not load", wanted, error)

        if (!cancelled) {
          setState({ path: wanted, url: null, failed: true })
        }
      }
    )

    return () => {
      cancelled = true
    }
  }, [wanted])

  const ready = wanted !== null && state.path === wanted

  return {
    url: ready ? state.url : null,
    loading: wanted !== null && !ready,
    failed: ready && state.failed,
  }
}

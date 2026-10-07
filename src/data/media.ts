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

async function optimizeUpload(file:File):Promise<Blob> {
 const url=URL.createObjectURL(file)
 try {
  const image=new Image()
  await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error("Rasmni o‘qib bo‘lmadi"));image.src=url})
  const ratio=Math.min(1,1200/image.naturalWidth,1400/image.naturalHeight)
  const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*ratio);canvas.height=Math.round(image.naturalHeight*ratio)
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height)
  return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Rasm tayyorlanmadi')),'image/jpeg',0.82))
 }finally{URL.revokeObjectURL(url)}
}

async function upload(folder: "president" | "employee" | "birthday" | "schedule" | "managers", file: File) {
  if (tvBackend !== "supabase") {
    throw new Error("Rasm yuklash faqat Supabase rejimida ishlaydi.")
  }

  const invalid = validateImageFile(file)

  if (invalid) {
    throw new Error(invalid)
  }

  const optimized = await optimizeUpload(file)
  const path = `${folder}/${crypto.randomUUID()}.jpg`

  let result

  try {
    result = await getSupabase()
      .storage.from(BUCKET)
      .upload(path, optimized, {
        upsert: false, // never overwrite
        contentType: "image/jpeg",
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

export function uploadBirthdayPhoto(file: File): Promise<string> {
  return upload("birthday", file)
}

export function uploadSchedulePortrait(file: File): Promise<string> {
  return upload("schedule", file)
}

export function uploadManagerPortrait(file: File): Promise<string> {
  return upload("managers", file)
}

// ======================================================
// AUTHENTICATED IMAGE LOADING (private bucket → blob URL)
// ======================================================

const MAX_CACHED = 48
const consumers = new Map<string,number>()
const urlCache = new Map<string, Promise<string>>()

function remember(path: string, promise: Promise<string>) {
  urlCache.set(path, promise)

  // Never revoke a URL that is still displayed by a mounted portrait.
  for(const [oldestPath,oldest] of urlCache){
    if(urlCache.size<=MAX_CACHED)break
    if(consumers.get(oldestPath))continue
    urlCache.delete(oldestPath)
    void oldest.then(url=>URL.revokeObjectURL(url)).catch(()=>{})
  }
}

/**
 * Object URL for a tv-media path, downloaded with the signed-in user's
 * session (RLS decides: editors see drafts, TVs only published images).
 */
async function fetchTvImage(path:string) {
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000)
 try{const response=await fetch('/api/tv-image?path='+encodeURIComponent(path),{signal:controller.signal,cache:'no-store'});if(!response.ok)throw new Error('Rasm yuklanmadi');return await response.blob()}finally{clearTimeout(timer)}
}
export function loadMediaUrl(path: string): Promise<string> {
  const cached = urlCache.get(path)

  if (cached) {
    return cached
  }

  const publicTv=!window.location.pathname.startsWith('/admin')&&!window.location.pathname.startsWith('/dashboard')
  const promise = publicTv&&!import.meta.env.DEV
    ? fetchTvImage(path).then(blob=>URL.createObjectURL(blob))
    : getSupabase().storage.from(BUCKET).download(path).then(({data,error})=>{
        if(error||!data)throw error??new Error('Rasm topilmadi')
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

    consumers.set(wanted,(consumers.get(wanted)||0)+1)
    let cancelled = false

    let loaded = false
    let pending = false
    const load = () => {
      if (loaded || pending || cancelled) return
      pending = true
      void loadMediaUrl(wanted).then(
        (url) => {
          loaded = true
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
      ).finally(() => {
        pending = false
      })
    }
    load()
    // Recover a failed photo request on unattended TVs, even with one slide.
    const timer = window.setInterval(load, 5_000)
    window.addEventListener("online", load)

    return () => {
      cancelled = true
      consumers.set(wanted,Math.max(0,(consumers.get(wanted)||1)-1))
      window.clearInterval(timer)
      window.removeEventListener("online", load)
    }
  }, [wanted])

  const ready = wanted !== null && state.path === wanted

  return {
    url: ready ? state.url : null,
    loading: wanted !== null && !ready,
    failed: ready && state.failed,
  }
}

const preloading=new Set<string>()
export function preloadMedia(paths:(string|null|undefined)[]) {
 const queue=[...new Set(paths.filter((p):p is string=>!!p))].filter(p=>!urlCache.has(p)&&!preloading.has(p))
 queue.forEach(p=>preloading.add(p))
 const worker=async()=>{for(let path=queue.shift();path;path=queue.shift()){try{await loadMediaUrl(path)}catch{/* Mounted images retry. */}finally{preloading.delete(path)}}}
 void worker();void worker()
}

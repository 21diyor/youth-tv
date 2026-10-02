import { useMediaUrl } from "@/data/media"
import { ImageUploadControl } from "./ImageUploadControl"

export function PortraitUpload({ path, initialPath, upload, onUploaded, fallback, hint }: {
  path?: string | null; initialPath?: string | null; fallback?: string | null
  upload: (file: File) => Promise<string>; onUploaded: (path: string) => void; hint?: string
}) {
  const photo = useMediaUrl(path || fallback)
  return <div className="flex items-center gap-6 rounded-xl bg-slate-50 p-5">
    <div className="flex h-52 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-200">
      {photo.url ? <img src={photo.url} alt="Rahbar portreti" className="h-full w-full object-cover object-top" /> : <span className="text-sm text-slate-500">Portret</span>}
    </div>
    <div className="w-full max-w-sm"><p className="mb-3 text-sm font-semibold">Rahbar rasmi</p><ImageUploadControl upload={upload} onUploaded={onUploaded} hasPendingImage={path !== initialPath} />{hint && <p className="mt-3 text-xs leading-relaxed text-slate-500">{hint}</p>}</div>
  </div>
}

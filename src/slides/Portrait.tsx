import { UserRound } from "lucide-react"
import { useMediaUrl } from "@/data/media"

export function Portrait({ path, name, className = "" }: { path?: string | null; name: string; className?: string }) {
  const photo = useMediaUrl(path)
  return <div className={`tv-portrait relative overflow-hidden rounded-[28px] ${className}`}>
    {photo.url ? <img decoding="async" src={photo.url} alt={name} className="absolute inset-0 h-full w-full object-cover object-top" /> : !photo.loading && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-400"><UserRound size={100} strokeWidth={1} aria-hidden="true" /><span className="text-sm">{name === "Vakant" ? "Vakant lavozim" : "Portret"}</span></div>}
  </div>
}

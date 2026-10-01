import { useEffect, useState } from "react"
import { getPublished, subscribe } from "@/data/tvStore"
import type { TvContentKey } from "@/data/tvTypes"

export function usePublishedContent<K extends TvContentKey>(key: K) {
  const [content, setContent] = useState(() => getPublished(key))
  useEffect(() => subscribe(key, () => setContent(getPublished(key))), [key])
  return content
}

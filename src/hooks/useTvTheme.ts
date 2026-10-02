import { useEffect, useState } from "react"
import { tashkentTheme } from "@/lib/tashkentTime"

export function useTvTheme() {
  const [theme, setTheme] = useState(() => tashkentTheme())
  useEffect(() => {
    const refresh = () => setTheme(tashkentTheme())
    const timer = window.setInterval(refresh, 1000)
    window.addEventListener("pageshow", refresh)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("pageshow", refresh)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [])
  return theme
}

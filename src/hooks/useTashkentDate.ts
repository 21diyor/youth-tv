import { useEffect, useState } from "react"
import { tashkentDate, tashkentPeriod } from "@/lib/tashkentTime"

export function useTashkentDate() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const refresh = () => setNow(new Date())
    const timer = window.setInterval(refresh, 1000)
    window.addEventListener("pageshow", refresh)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      clearInterval(timer)
      window.removeEventListener("pageshow", refresh)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [])
  return { date: tashkentDate(now), ...tashkentPeriod(now) }
}

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { CitizenAppealsSlide } from "@/slides/CitizenAppealsSlide"
import { EmployeeOfMonthSlide } from "@/slides/EmployeeOfMonthSlide"
import { PresidentQuoteSlide } from "@/slides/PresidentQuoteSlide"
import { BirthdaySlide, ManagementScheduleSlide, ManagerAppealsSlide } from "@/slides/DepartmentSlides"
import { usePublishedContent } from "@/hooks/usePublishedContent"
import { useTvTheme } from "@/hooks/useTvTheme"
import { ChevronLeft, ChevronRight, Pause, Play, Maximize, Minimize } from "lucide-react"

const TRANSITION_MS = 450

export function Slideshow() {
  const settings = usePublishedContent("settings")
  const schedule = usePublishedContent("schedule")
  const managers = usePublishedContent("managers")
  const birthday = usePublishedContent("birthday")
  const slides = [
    { id: "appeals", enabled: settings.appealsEnabled, element: <CitizenAppealsSlide /> },
    { id: "schedule", enabled: schedule.enabled, element: <ManagementScheduleSlide /> },
    ...managers.managers.map((manager, index) => ({ id: `manager-${index}`, enabled: manager.enabled, element: <ManagerAppealsSlide index={index} /> })),
    { id: "birthday", enabled: birthday.enabled, element: <BirthdaySlide /> },
    { id: "employee", enabled: settings.employeeEnabled, element: <EmployeeOfMonthSlide /> },
    { id: "president", enabled: settings.presidentEnabled, element: <PresidentQuoteSlide /> },
  ].filter(slide => slide.enabled)
  const ids = slides.map(slide => slide.id).join(",")
  const duration = Math.max(5, settings.intervalSeconds) * 1000
  return <Playback key={`${ids}-${duration}`} slides={slides} duration={duration} />
}

function Playback({ slides, duration }: { slides: { id: string; element: ReactNode }[]; duration: number }) {
  const theme = useTvTheme()
  const [scale, setScale] = useState(() => Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
  useEffect(() => {
    const resize = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])
  const ids = slides.map(slide => slide.id).join(",")
  // Start each playlist at its first enabled slide.
  const [activeId, setActiveId] = useState("appeals")
  const [cycle, setCycle] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [paused, setPaused] = useState(false)
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement)
  const [controlMessage, setControlMessage] = useState("")
  const [controlsVisible, setControlsVisible] = useState(true)
  const remaining = useRef(duration)
  const timedCycle = useRef(0)
  const activeIndex = Math.max(0, slides.findIndex(slide => slide.id === activeId))
  const current = slides[activeIndex]
  const currentId = current?.id
  const timer = useRef<number | undefined>(undefined)
  const locked = useRef(false)

  const advance = useCallback((direction: number) => {
    if (locked.current) return
    const order = ids ? ids.split(",") : []
    if (!order.length) return
    locked.current = true
    setLeaving(true)
    timer.current = window.setTimeout(() => {
      const index = Math.max(0, order.indexOf(currentId ?? ""))
      setActiveId(order[(index + direction + order.length) % order.length])
      setCycle(value => value + 1)
      setLeaving(false)
      locked.current = false
    }, TRANSITION_MS)
  }, [ids, currentId])

  useEffect(() => {
    if (timedCycle.current !== cycle) {
      timedCycle.current = cycle
      remaining.current = duration
    }
    if (paused || leaving || !currentId) return
    const started = performance.now()
    const timeout = window.setTimeout(() => advance(1), remaining.current)
    return () => {
      window.clearTimeout(timeout)
      remaining.current = Math.max(0, remaining.current - (performance.now() - started))
    }
  }, [advance, duration, cycle, paused, leaving, currentId])

  useEffect(() => {
    const refresh = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", refresh)
    return () => document.removeEventListener("fullscreenchange", refresh)
  }, [])

  useEffect(() => {
    let hide: number
    const show = () => {
      setControlsVisible(true)
      window.clearTimeout(hide)
      hide = window.setTimeout(() => setControlsVisible(false), 6000)
    }
    show()
    window.addEventListener("pointermove", show)
    window.addEventListener("pointerdown", show)
    window.addEventListener("keydown", show)
    return () => {
      window.clearTimeout(hide)
      window.removeEventListener("pointermove", show)
      window.removeEventListener("pointerdown", show)
      window.removeEventListener("keydown", show)
    }
  }, [])

  const toggleFullscreen = async () => {
    setControlMessage("")
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen()
      else setControlMessage("Bu brauzer to‘liq ekran rejimini qo‘llamaydi.")
    } catch {
      setControlMessage("To‘liq ekran ochilmadi. Brauzer menyusidan foydalaning.")
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest("input,textarea,select,[contenteditable=true]")) return
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault()
        advance(event.key === "ArrowRight" ? 1 : -1)
      }
      if (event.code === "Space" && !(event.target instanceof HTMLElement && event.target.closest("button"))) {
        event.preventDefault()
        setPaused(value => !value)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [advance])

  // Cancel any transition whose captured playlist is no longer current.
  useEffect(() => {
    return () => {
      window.clearTimeout(timer.current)
      locked.current = false
    }
  }, [ids])

  if (!current) return <main className="tv-playback tv-empty" data-theme={theme}>Faol slayd mavjud emas</main>
  return <div className="tv-playback" data-theme={theme}>
    <div className="tv-canvas" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
    <div key={`${current.id}-${cycle}`} className={`tv-slide ${leaving ? "tv-slide-leaving" : "tv-slide-entering"}`}>
      {current.element}
    </div>
    </div>
    <div className="tv-progress-track" aria-hidden="true">
      <div key={`${current.id}-${ids}-${cycle}-${duration}`} className="tv-progress-fill" style={{ animationDuration: `${duration}ms`, animationPlayState: paused || leaving ? "paused" : "running" }} />
    </div>
    <nav className={`tv-controls ${controlsVisible || paused || controlMessage ? "is-visible" : ""}`} aria-label="Slayd boshqaruvi">
      <button onClick={() => advance(-1)} disabled={leaving} aria-label="Oldingi slayd" title="Oldingi slayd"><ChevronLeft /><span>Oldingi</span></button>
      <button onClick={() => setPaused(value => !value)} aria-label={paused ? "Davom ettirish" : "Pauza"} aria-pressed={paused}>{paused ? <Play /> : <Pause />}<span>{paused ? "Davom ettirish" : "Pauza"}</span></button>
      <button onClick={() => advance(1)} disabled={leaving} aria-label="Keyingi slayd" title="Keyingi slayd"><span>Keyingi</span><ChevronRight /></button>
      <button onClick={toggleFullscreen} aria-label={fullscreen ? "To‘liq ekrandan chiqish" : "To‘liq ekran"} title="To‘liq ekran">{fullscreen ? <Minimize /> : <Maximize />}<span>{fullscreen ? "Chiqish" : "To‘liq ekran"}</span></button>
      {controlMessage && <p role="status">{controlMessage}</p>}
    </nav>
  </div>
}

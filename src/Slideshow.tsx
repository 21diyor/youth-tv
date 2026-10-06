import { HrGroupSlide } from "@/slides/HrGroupSlide"
import { useCallback, useEffect, useState, type ReactNode } from "react"
import { CitizenAppealsSlide } from "@/slides/CitizenAppealsSlide"
import { EmployeeOfMonthSlide } from "@/slides/EmployeeOfMonthSlide"
import { PresidentQuoteSlide } from "@/slides/PresidentQuoteSlide"
import { BirthdaySlide, ManagementScheduleSlide, ManagerAppealsSlide } from "@/slides/DepartmentSlides"
import {usePlaybackState,type PlaybackState} from "@/hooks/usePlaybackState"
import {timelinePosition,type TimedSlide} from "@/lib/playbackTimeline"
import { useTvTheme } from "@/hooks/useTvTheme"
import { ChevronLeft, ChevronRight, Pause, Play, Maximize, Minimize } from "lucide-react"

const TRANSITION_MS = 450

export function Slideshow() {
  const {state,offline}=usePlaybackState()
  if(!state)return <main className="tv-playback tv-empty">{offline?"Serverga ulanilmoqda… Internet aloqasini tekshiring.":"TVlar sinxronlanmoqda…"}</main>
  const slides=state.slides.map(slot=>{
    let element:ReactNode=null
    if(slot.id==="appeals")element=<CitizenAppealsSlide/>
    else if(slot.id==="schedule")element=<ManagementScheduleSlide/>
    else if(slot.id==="president")element=<PresidentQuoteSlide/>
    else if(slot.id.startsWith("manager-"))element=<ManagerAppealsSlide index={Number(slot.id.split("-")[1])}/>
    else if(slot.id.includes('-group-')){const birthday=slot.id.startsWith('birthday');element=<HrGroupSlide birthday={birthday} people={birthday?state.hr.birthdays:state.hr.employees} page={Number(slot.id.split('-').at(-1))}/>}
    else if(slot.id.startsWith("birthday-")){const person=state.hr.birthdays.find(p=>"birthday-"+p.id===slot.id);if(person)element=<BirthdaySlide content={person}/>}
    else if(slot.id.startsWith("employee-")){const person=state.hr.employees.find(p=>"employee-"+p.id===slot.id);if(person)element=<EmployeeOfMonthSlide content={person}/>}
    return {...slot,element}
  })
  return <Playback slides={slides} state={state} offline={offline}/>
}

function Playback({slides,state,offline}:{slides:(TimedSlide & {element:ReactNode})[];state:PlaybackState;offline:boolean}) {
  const theme = useTvTheme()
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  const scale = Math.min(viewport.width / 1920, viewport.height / 1080)
  const sideMargin = Math.max(0, (viewport.width / scale - 1920) / 2)
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])
  const [tick,setTick]=useState(()=>performance.now())
  const [manual,setManual]=useState<{id:string;elapsed:number}|null>(null)
  const paused=manual!==null
  const [fullscreen,setFullscreen]=useState(!!document.fullscreenElement)
  const [controlMessage,setControlMessage]=useState("")
  const [controlsVisible,setControlsVisible]=useState(true)
  useEffect(()=>{const timer=window.setInterval(()=>setTick(performance.now()),50);return()=>clearInterval(timer)},[])
  const live=timelinePosition(slides,state.serverNow+tick-state.measuredAt)
  const manualIndex=manual?slides.findIndex(s=>s.id===manual.id):-1
  const activeIndex=manualIndex>=0?manualIndex:live?.index??0
  const current=slides[activeIndex]
  const elapsed=manualIndex>=0?Math.min(manual!.elapsed,current.durationMs):live?.elapsed??0
  const duration=current?.durationMs??5000
  const leaving=!paused&&duration-elapsed<=TRANSITION_MS
  const togglePause=useCallback(()=>setManual(old=>old?null:current?{id:current.id,elapsed}:null),[current,elapsed])
  const advance=useCallback((direction:number)=>{
    if(!slides.length)return
    const next=slides[(activeIndex+direction+slides.length)%slides.length]
    setManual({id:next.id,elapsed:0})
  },[slides,activeIndex])
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
        togglePause()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [advance,togglePause])

  if (!current) return <main className="tv-playback tv-empty" data-theme={theme}>Faol slayd mavjud emas</main>
  return <div className="tv-playback" data-theme={theme} data-slide-id={current.id} data-synced={!paused} data-duration-ms={duration}>
    <div className="tv-canvas" style={{ transform: `translate(-50%, -50%) scale(${scale})`, ...{ "--tv-side-margin": `${sideMargin}px` } }}>
    <div key={`${current.id}-${paused?"manual":live?.cycle}`} className={`tv-slide ${leaving ? "tv-slide-leaving" : "tv-slide-entering"}`}>
      {current.element}
    </div>
    </div>
    <div className="tv-progress-track" aria-hidden="true">
      <div className="tv-progress-fill" style={{animation:"none",transform:`scaleX(${Math.min(1,elapsed/duration)})`}} />
    </div>
    <nav className={`tv-controls ${controlsVisible || paused || controlMessage ? "is-visible" : ""}`} aria-label="Slayd boshqaruvi">
      <button onClick={() => advance(-1)} aria-label="Oldingi slayd" title="Oldingi slayd"><ChevronLeft /><span>Oldingi</span></button>
      <button onClick={() => togglePause()} aria-label={paused ? "Sinxron efirga qaytish" : "Pauza"} aria-pressed={paused}>{paused ? <Play /> : <Pause />}<span>{paused ? "Sinxron efirga qaytish" : "Pauza"}</span></button>
      <button onClick={() => advance(1)} aria-label="Keyingi slayd" title="Keyingi slayd"><span>Keyingi</span><ChevronRight /></button>
      <button onClick={toggleFullscreen} aria-label={fullscreen ? "To‘liq ekrandan chiqish" : "To‘liq ekran"} title="To‘liq ekran">{fullscreen ? <Minimize /> : <Maximize />}<span>{fullscreen ? "Chiqish" : "To‘liq ekran"}</span></button>
      {paused&&<p>Faqat shu ekranda pauza</p>}{offline&&<p>Oflayn · oxirgi jadval</p>}{controlMessage && <p role="status">{controlMessage}</p>}
    </nav>
  </div>
}

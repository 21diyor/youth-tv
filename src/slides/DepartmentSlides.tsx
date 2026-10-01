import type { ReactNode } from "react"
import { usePublishedContent } from "@/hooks/usePublishedContent"
import { useTashkentDate } from "@/hooks/useTashkentDate"
import { useMediaUrl } from "@/data/media"
import { commonData } from "@/data/tvData"
import { AppealStats } from "./AppealStats"

function SlideFrame({ title, children, celebration = false }: { title: string; children: ReactNode; celebration?: boolean }) {
  const { date } = useTashkentDate()
  return <main className={`department-slide ${celebration ? "birthday-slide" : ""}`}>
    <header className="flex items-start justify-between gap-8">
      <div><p className="text-sm font-semibold uppercase tracking-[.18em] text-slate-500">{commonData.agencyName}</p><h1 className="mt-3 text-[42px] font-semibold leading-tight tracking-tight">{title}</h1></div>
      <div className="shrink-0 text-right"><p className="text-lg font-semibold">{date}</p><p className="mt-1 text-sm text-slate-500">Toshkent vaqti</p></div>
    </header>
    <section className="relative flex min-h-0 flex-1 flex-col justify-center">{children}</section>
    <footer className="border-t border-black/10 pt-4 text-sm text-slate-500">Yoshlar ishlari agentligi</footer>
  </main>
}

export function ManagementScheduleSlide() {
  const { entries } = usePublishedContent("schedule")
  return <SlideFrame title="Rahbariyat qabul jadvali">
    <div className="my-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="schedule-row bg-blue-900 text-sm font-semibold uppercase tracking-wider text-white"><span>Rahbar</span><span>Qabul kuni</span><span>Vaqt</span><span>Manzil</span></div>
      {entries.map((entry, i) => <div key={i} className="schedule-row border-t border-slate-100">
        <div><p className="text-[23px] font-semibold">{entry.name}</p><p className="mt-2 text-[15px] leading-relaxed text-slate-500">{entry.title}</p></div>
        <p className="text-xl font-medium">{entry.day}</p><p className="text-xl font-semibold text-blue-800">{entry.time}</p><p className="text-lg text-slate-600">{entry.location}</p>
      </div>)}
    </div>
  </SlideFrame>
}

export function ManagerAppealsSlide({ index }: { index: number }) {
  const content = usePublishedContent("managers").managers[index]
  if (!content) return null
  const percent = content.total > 0 ? content.resolved / content.total * 100 : 0
  return <SlideFrame title="Rahbariyat murojaatlari">
    <div className="mb-10"><p className="mb-4 text-sm font-semibold uppercase tracking-[.2em] text-blue-700">Rahbar {index + 1} / 4</p><h2 className="max-w-[1200px] text-[52px] font-semibold leading-tight tracking-tight">{content.name}</h2><p className="mt-4 max-w-[1100px] text-[24px] text-slate-500">{content.title}</p></div>
    <AppealStats {...content} />
    <div className="mt-10 rounded-2xl border border-emerald-100 bg-white p-6"><div className="mb-4 flex justify-between text-lg"><span>Hal etilgan murojaatlar ulushi</span><strong className="text-emerald-800">{percent.toFixed(1)}%</strong></div><div className="h-4 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700" style={{ width: `${percent}%` }} /></div></div>
  </SlideFrame>
}

export function BirthdaySlide() {
  const content = usePublishedContent("birthday")
  const photo = useMediaUrl(content.photoPath)
  return <SlideFrame title="Bugungi tabrik" celebration>
    <div className="celebration-particles" aria-hidden="true">
      {Array.from({ length: 42 }, (_, i) => <i key={i} className="confetti" style={{ left: `${(i * 37) % 100}%`, background: ["#2563eb", "#fbbf24", "#f472b6", "#10b981", "#a78bfa"][i % 5], animationDelay: `${(i % 9) * .18}s`, animationDuration: `${3 + i % 4}s`, transform: `rotate(${i * 23}deg)` }} />)}
      {[8, 22, 77, 91].map((left, i) => <span key={left} className="birthday-balloon" style={{ left: `${left}%`, animationDelay: `${i * .25}s` }}>🎈</span>)}
    </div>
    <div className="birthday-card relative z-10 my-8 grid grid-cols-[.7fr_1fr] items-center gap-14">
      <div className="h-[540px] overflow-hidden rounded-[32px] border-8 border-white bg-blue-50 shadow-xl">{photo.url ? <img src={photo.url} alt={content.name} className="h-full w-full object-cover object-top" /> : <div className="flex h-full items-center justify-center text-8xl" aria-label="Tabrik">🎉</div>}</div>
      <div className="rounded-[32px] border border-white bg-white/90 p-10 shadow-sm"><p className="text-5xl" aria-hidden="true">🎉 🎂</p><h2 className="mt-6 text-[54px] font-semibold leading-tight tracking-tight text-blue-900">Tug‘ilgan kuningiz muborak!</h2><h3 className="mt-6 text-[32px] font-semibold">{content.name}</h3><p className="mt-2 text-xl text-slate-500">{content.department}</p><p className="mt-7 whitespace-pre-line text-[23px] leading-relaxed text-slate-700">{content.message}</p></div>
    </div>
  </SlideFrame>
}

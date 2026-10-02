import type { ReactNode } from "react"
import { CalendarDays, Clock3, MapPin } from "lucide-react"
import { usePublishedContent } from "@/hooks/usePublishedContent"
import { useTashkentDate } from "@/hooks/useTashkentDate"
import { commonData } from "@/data/tvData"
import { AppealStats } from "./AppealStats"
import { Portrait } from "./Portrait"
import { CornerConfetti, PremiumPopper } from "./Celebration"
import { UzbekistanFlag } from "./UzbekistanFlag"

function SlideFrame({ title, children, celebration = false, flag = false }: { title: string; children: ReactNode; celebration?: boolean; flag?: boolean }) {
  const { date } = useTashkentDate()
  return <main className={`department-slide ${celebration ? "birthday-slide" : ""}`}>
    {flag && <UzbekistanFlag />}
    <header className="relative z-10 flex items-start justify-between gap-8">
      <div><p className="text-sm font-semibold uppercase tracking-[.18em] text-slate-500">{commonData.agencyName}</p><h1 className="mt-3 text-[42px] font-semibold leading-tight tracking-tight">{title}</h1></div>
      <div className="shrink-0 text-right"><p className="text-lg font-semibold">{date}</p><p className="mt-1 text-sm text-slate-500">Toshkent vaqti</p></div>
    </header>
    <section className="relative z-10 flex min-h-0 flex-1 flex-col justify-center">{children}</section>
    <footer className="relative z-10 border-t border-black/10 pt-4 text-sm text-slate-500">Yoshlar ishlari agentligi</footer>
    {celebration && <CornerConfetti />}
  </main>
}

export function ManagementScheduleSlide() {
  const { entries } = usePublishedContent("schedule")
  return <SlideFrame title="Rahbariyat qabul jadvali" flag>
    <div className="management-cards">
      {entries.map((entry, i) => <article key={i} className="management-card">
        <Portrait path={entry.photoPath} name={entry.name} className="schedule-portrait" />
        <div className="management-card-body">
          <h2 className="manager-card-name">{entry.name}</h2>
          <p className="manager-card-title">{entry.title}</p>
          <div className="mt-auto space-y-4 border-t border-slate-100 pt-5">
            <div className="flex items-start gap-3"><CalendarDays size={21} className="mt-1 shrink-0 text-blue-600" /><div><p className="text-xs uppercase tracking-wider text-slate-400">Qabul kuni</p><p className="mt-1 text-[19px] font-semibold">{entry.day}</p></div></div>
            <div className="flex items-start gap-3"><Clock3 size={21} className="mt-1 shrink-0 text-blue-600" /><div><p className="text-xs uppercase tracking-wider text-slate-400">Qabul vaqti</p><p className="mt-1 text-[22px] font-semibold text-blue-800">{entry.time}</p></div></div>
            <div className="flex items-start gap-3"><MapPin size={21} className="mt-1 shrink-0 text-slate-400" /><p className="text-[17px] leading-snug text-slate-600">{entry.location}</p></div>
          </div>
        </div>
      </article>)}
    </div>
  </SlideFrame>
}

export function ManagerAppealsSlide({ index }: { index: number }) {
  const content = usePublishedContent("managers").managers[index]
  const schedule = usePublishedContent("schedule")
  if (!content) return null
  const percent = content.total > 0 ? content.resolved / content.total * 100 : 0
  return <SlideFrame title="Rahbariyat murojaatlari">
    <div className="manager-detail-grid">
      <Portrait path={content.photoPath || schedule.entries[index]?.photoPath} name={content.name} className="h-full" />
      <div className="flex min-w-0 flex-col justify-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[.2em] text-blue-700">Rahbar {index + 1} / 4</p>
        <h2 className="text-[46px] font-semibold leading-tight tracking-tight">{content.name}</h2>
        <p className="mt-4 text-[22px] leading-relaxed text-slate-500">{content.title}</p>
        <div className="mt-8"><AppealStats {...content} twoColumns /></div>
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-6"><div className="mb-4 flex justify-between text-lg"><span>Hal etilgan murojaatlar ulushi</span><strong className="text-emerald-800">{percent.toFixed(1)}%</strong></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700" style={{ width: `${percent}%` }} /></div></div>
      </div>
    </div>
  </SlideFrame>
}

export function BirthdaySlide() {
  const content = usePublishedContent("birthday")
  return <SlideFrame title="Bugungi tabrik" celebration>
    <div className="birthday-card birthday-detail-grid">
      <Portrait path={content.photoPath} name={content.name} className="h-full shadow-lg" />
      <div className="self-center rounded-[36px] border border-white bg-white/85 p-12 shadow-sm">
        <PremiumPopper />
        <h2 className="mt-7 text-[56px] font-semibold leading-[1.08] tracking-tight text-blue-950">Tug‘ilgan kuningiz muborak!</h2>
        <h3 className="mt-8 text-[34px] font-semibold leading-tight">{content.name}</h3>
        <p className="mt-3 text-[21px] leading-relaxed text-slate-500">{content.department}</p>
        <p className="mt-7 whitespace-pre-line text-[23px] leading-relaxed text-slate-700">{content.message}</p>
      </div>
    </div>
  </SlideFrame>
}

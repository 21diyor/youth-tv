import { useCurrentHrSlides } from "@/data/hrPlans"
import { useEffect, useReducer } from "react"
import { useTashkentDate } from "@/hooks/useTashkentDate"
import { tashkentDate } from "@/lib/tashkentTime"
import {
  getContentMeta,
  getPublished,
  getPresidentContent,
  getSlideSettings,
  subscribe,
  type TvContentKey,
} from "@/data/tvStore"

const keys: TvContentKey[] = ["president", "appeals", "employee", "settings", "schedule", "managers", "birthday"]
const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeStyle: "short",
  timeZone: "Asia/Tashkent",
})

export function OverviewContent() {
  const calendar = useTashkentDate()
  const hr = useCurrentHrSlides()
  const [, refresh] = useReducer((value: number) => value + 1, 0)
  useEffect(() => {
    const cleanup = keys.map((key) => subscribe(key, refresh))
    return () => cleanup.forEach((unsubscribe) => unsubscribe())
  }, [])

  const settings = getSlideSettings()
  const president = getPresidentContent()
  const slides = [
    { key: "appeals", title: "Fuqarolar murojaatlari", detail: "Statistika va analitika", enabled: settings.appealsEnabled },
    { key: "schedule", title: "Rahbariyat qabul jadvali", detail: "HR bo‘limi", enabled: getPublished("schedule").enabled },
    ...getPublished("managers").managers.map((manager, i) => ({ key: `manager-${i}`, title: manager.name || `Rahbar ${i + 1}`, detail: "Murojaatlar bo‘limi", enabled: manager.enabled })),
    ...(hr?.birthdays.length?[{key:"birthday-group",title:"Bugungi tavallud ayyomlari",detail:`${hr.birthdays.length} xodim`,enabled:getPublished("birthday").enabled}]:[]),
    ...(hr?.birthdays ?? []).map(person => ({ key: `birthday-${person.id}`, title: "Tug‘ilgan kun tabrigi", detail: person.name, enabled: getPublished("birthday").enabled })),
    ...(hr?.employees.length?[{key:"employee-group",title:"Oy xodimlari",detail:`${calendar.month} ${calendar.year}`,enabled:settings.employeeEnabled}]:[]),
    ...(hr?.employees??[]).map(person=>({key:`employee-${person.id}`,title:"Oy xodimi",detail:person.name,enabled:settings.employeeEnabled})),
    { key: "president", title: "Prezident fikri", detail: president.sourceDate, enabled: settings.presidentEnabled },
  ] as const
  const publishedDates = keys.map((key) => getContentMeta(key).publishedAt)
    .filter((value): value is string => value !== null)
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite)
  const latestDate = publishedDates.length ? new Date(Math.max(...publishedDates)) : null
  const lastPublished = latestDate ? `${tashkentDate(latestDate)} ${timeFormat.format(latestDate)}` : "Hali e’lon qilinmagan"

  return (
    <>
      <h3 className="text-[32px] font-semibold tracking-[-0.045em]">TV platformasi</h3>
      <p className="mt-2 text-[13px] text-neutral-500">TV ekranlarida namoyish etiladigan e’lon qilingan kontent.</p>
      <section aria-label="Tizim holati" className="mt-[34px] grid grid-cols-1 divide-y border-y border-neutral-200 bg-white md:grid-cols-3 md:divide-x md:divide-y-0">
        {[
          ["Faol slaydlar", `${slides.filter((slide) => slide.enabled).length} / ${slides.length}`],
          ["Slayd intervali", `${settings.intervalSeconds} soniya`],
          ["Oxirgi e’lon", lastPublished],
        ].map(([label, value]) => (
          <div key={label} className="px-6 py-[22px]">
            <p className="text-[11px] font-medium text-neutral-500">{label}</p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </section>
      <section className="mt-[38px]">
        <h3 className="text-[22px] font-semibold">Slaydlar</h3>
        <div className="mt-4 border-t border-neutral-200">
          {slides.map((slide, index) => (
            <div key={slide.key} className="grid grid-cols-[32px_1fr_auto] items-center gap-4 border-b border-neutral-200 bg-white px-5 py-[18px]">
              <span className="text-[11px] font-semibold text-neutral-400">0{index + 1}</span>
              <div>
                <p className="text-[14px] font-semibold">{slide.title}</p>
                <p className="mt-1 text-[11px] text-neutral-500">{slide.detail}</p>
              </div>
              <span className={`text-[11px] font-semibold ${slide.enabled ? "text-emerald-700" : "text-neutral-500"}`}>
                {slide.enabled ? "Faol" : "O‘chirilgan"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

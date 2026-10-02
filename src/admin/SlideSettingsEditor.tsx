import { useState } from "react"
import { usePublishedContent } from "@/hooks/usePublishedContent"
import { getDraft, getSaveErrorMessage, saveDraft, publish, setSlideVisibility } from "@/data/tvStore"
import type { TvContentKey } from "@/data/tvTypes"

export function SlideSettingsEditor() {
  const settings = usePublishedContent("settings")
  const schedule = usePublishedContent("schedule")
  const managers = usePublishedContent("managers")
  const birthday = usePublishedContent("birthday")
  const [interval, setInterval] = useState(() => String(getDraft("settings").intervalSeconds))
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const intervalNumber = Number(interval)
  const valid = Number.isInteger(intervalNumber) && intervalNumber >= 5 && intervalNumber <= 300
  const slides: { id: string; key: Exclude<TvContentKey, "settings">; index?: number; title: string; detail: string; enabled: boolean }[] = [
    { id: "appeals", key: "appeals", title: "Fuqarolar murojaatlari", detail: "Umumiy statistika", enabled: settings.appealsEnabled },
    { id: "schedule", key: "schedule", title: "Rahbariyat qabul jadvali", detail: "Rahbarlar kartochkalari va qabul vaqti", enabled: schedule.enabled },
    ...managers.managers.map((manager, index) => ({ id: `manager-${index}`, key: "managers" as const, index, title: manager.name || `Rahbar ${index + 1}`, detail: "Rahbar murojaatlari", enabled: manager.enabled })),
    { id: "birthday", key: "birthday", title: "Tug‘ilgan kun tabrigi", detail: birthday.name || "Xodim tabrigi", enabled: birthday.enabled },
    { id: "employee", key: "employee", title: "Oy xodimi", detail: "Xodim ma’lumotlari va asosiy natijalar", enabled: settings.employeeEnabled },
    { id: "president", key: "president", title: "Prezident fikri", detail: "Iqtibos va portret", enabled: settings.presidentEnabled },
  ]
  const count = slides.filter(slide => slide.enabled).length

  const changeVisibility = async (slide: typeof slides[number]) => {
    if (busy) return
    setBusy(slide.id); setError(""); setMessage("")
    try {
      await setSlideVisibility(slide.key, !slide.enabled, slide.index ?? 0)
      setMessage(`${slide.title}: ${slide.enabled ? "o‘chirildi" : "yoqildi"}.`)
    } catch (err) { setError(getSaveErrorMessage(err)) }
    finally { setBusy(null) }
  }

  const saveInterval = async () => {
    if (!valid || busy) return
    setBusy("interval"); setError(""); setMessage("")
    try {
      await saveDraft("settings", { ...getDraft("settings"), intervalSeconds: intervalNumber })
      await publish("settings")
      setMessage("Interval saqlandi va TV ekranlariga yuborildi.")
    } catch (err) { setError(getSaveErrorMessage(err)) }
    finally { setBusy(null) }
  }

  return <div>
    <h3 className="text-[32px] font-semibold tracking-tight">Slayd sozlamalari</h3>
    <p className="mt-2 text-sm text-slate-500">Namoyish vaqtini va barcha slaydlarning ko‘rinishini boshqaring.</p>
    <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
      <label htmlFor="slide-interval" className="font-semibold">Har bir slayd davomiyligi</label>
      <div className="mt-4 flex items-center gap-4">
        <input id="slide-interval" className="w-32 rounded-lg border border-slate-200 px-4 py-2" type="number" min={5} max={300} step={1} value={interval} onChange={e => setInterval(e.target.value)} />
        <span className="text-sm text-slate-500">soniya · 5–300</span>
        <button onClick={saveInterval} disabled={!valid || !!busy} className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy === "interval" ? "Saqlanmoqda…" : "Intervalni e’lon qilish"}</button>
      </div>
    </section>
    <div className="mt-4 min-h-6 text-sm" role="status" aria-live="polite">{error ? <span className="text-red-700">{error}</span> : <span className="text-emerald-700">{message}</span>}</div>
    <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 p-6">
        <div><h4 className="font-semibold">Barcha slaydlar</h4><p className="mt-2 text-xs text-slate-500">Tugmalar darhol qo‘llanadi. Faqat ko‘rinish o‘zgaradi; boshqa qoralamalar e’lon qilinmaydi.</p></div>
        <span className="ml-5 shrink-0 text-sm font-semibold text-blue-700">{count} / {slides.length} faol</span>
      </header>
      {slides.map((slide, i) => <div key={slide.id} className="grid grid-cols-[46px_1fr_auto] items-center gap-4 border-b border-slate-100 px-6 py-5 last:border-b-0">
        <span className="text-xs font-semibold text-slate-400">{String(i + 1).padStart(2, "0")}</span>
        <div><p className="text-sm font-semibold">{slide.title}</p><p className="mt-1 text-xs text-slate-500">{slide.detail}</p></div>
        <button type="button" role="switch" aria-label={slide.title} aria-checked={slide.enabled} disabled={!!busy} onClick={() => changeVisibility(slide)} className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-40 ${slide.enabled ? "bg-blue-700" : "bg-slate-300"}`}>
          <span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all ${slide.enabled ? "left-[23px]" : "left-[3px]"}`} />
        </button>
      </div>)}
    </section>
    <p className="mt-5 text-sm text-slate-500">{count ? `To‘liq sikl: taxminan ${Math.round((settings.intervalSeconds + .45) * count)} soniya.` : "Barcha slaydlar o‘chirilgan. TV ekranida faol slayd yo‘qligi ko‘rsatiladi."}</p>
  </div>
}

import { useState, type ReactNode } from "react"
import { getDraft } from "@/data/tvStore"
import { uploadBirthdayPhoto, useMediaUrl } from "@/data/media"
import { useDraftPublish } from "./useDraftPublish"
import { DraftPublishActions } from "./DraftPublishActions"
import { ImageUploadControl } from "./ImageUploadControl"

function Field({ label, value, onChange, numeric = false, multiline = false }: { label: string; value: string | number; onChange: (value: string) => void; numeric?: boolean; multiline?: boolean }) {
  const classes = "mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm"
  return <label className="block text-sm font-medium">{label}{multiline
    ? <textarea className={classes} rows={4} maxLength={1000} value={value} onChange={e => onChange(e.target.value)} />
    : <input className={classes} maxLength={200} type={numeric ? "number" : "text"} min={numeric ? 0 : undefined} max={numeric ? 2147483647 : undefined} step={numeric ? 1 : undefined} value={value} onChange={e => onChange(e.target.value)} />}</label>
}
function Enabled({ checked, onChange }: { checked: boolean; onChange: (enabled: boolean) => void }) {
  return <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />TV ekranida ko‘rsatish</label>
}
function EditorFrame({ title, actions, children }: { title: string; actions: ReactNode; children: ReactNode }) {
  return <div><header className="mb-8 flex items-start justify-between gap-6"><div><h3 className="text-3xl font-semibold">{title}</h3><p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">O‘zgarishlarni saqlang, so‘ng e’lon qiling. TV ekranlari avtomatik yangilanadi. Sana Toshkent vaqti bilan avtomatik ko‘rsatiladi.</p></div>{actions}</header><div className="space-y-6">{children}</div></div>
}
const panel = "space-y-5 rounded-xl border border-slate-200 bg-white p-6"

export function ScheduleEditor() {
  const [draft, setDraft] = useState(() => getDraft("schedule"))
  const valid = !draft.enabled || draft.entries.every(row => Object.values(row).every(value => value.trim().length > 0))
  const actions = useDraftPublish("schedule", draft, valid)
  return <EditorFrame title="Rahbariyat qabul jadvali" actions={<DraftPublishActions state={actions} />}>
    <Enabled checked={draft.enabled} onChange={enabled => setDraft({ ...draft, enabled })} />
    {!valid && <p role="alert" className="text-sm text-red-700">Jadvalni yoqish uchun barcha maydonlarni to‘ldiring.</p>}
    {draft.entries.map((row, i) => <section key={i} className={panel}><h4 className="font-semibold">Rahbar {i + 1}</h4><div className="grid grid-cols-2 gap-5">
      {([["name", "Ism familiya"], ["title", "Lavozimi"], ["day", "Qabul kuni (masalan, Dushanba)"], ["time", "Qabul vaqti (masalan, 10:00–12:00)"], ["location", "Qabul manzili"]] as const).map(([key, label]) => <Field key={key} label={label} value={row[key]} onChange={value => setDraft({ ...draft, entries: draft.entries.map((entry, index) => index === i ? { ...entry, [key]: value } : entry) })} />)}
    </div></section>)}
  </EditorFrame>
}

export function ManagersEditor() {
  const [draft, setDraft] = useState(() => getDraft("managers"))
  const valid = draft.managers.every(row =>
    [row.total, row.resolved, row.inProgress, row.overdue].every(n => Number.isInteger(n) && n >= 0 && n <= 2147483647)
    && row.total === row.resolved + row.inProgress + row.overdue
    && (!row.enabled || (row.name.trim() && row.title.trim())))
  const actions = useDraftPublish("managers", draft, !!valid)
  return <EditorFrame title="Rahbarlar murojaatlari" actions={<DraftPublishActions state={actions} />}>
    <p className="text-sm text-slate-600">Har bir rahbar alohida slaydda ko‘rsatiladi. Haqiqiy raqamlarni kiriting va tegishli slaydni yoqing.</p>
    {!valid && <p role="alert" className="text-sm text-red-700">Jami = hal etilgan + jarayonda + muddati o‘tgan. Sonlar manfiy bo‘lmasligi, faol slaydda ism va lavozim bo‘lishi kerak.</p>}
    {draft.managers.map((row, i) => {
      const update = (key: keyof typeof row, value: string | number | boolean) => setDraft({ managers: draft.managers.map((entry, index) => index === i ? { ...entry, [key]: value } : entry) })
      return <section key={i} className={panel}><div className="flex justify-between"><h4 className="font-semibold">Rahbar {i + 1}</h4><Enabled checked={row.enabled} onChange={value => update("enabled", value)} /></div>
        <div className="grid grid-cols-2 gap-5"><Field label="Ism familiya" value={row.name} onChange={v => update("name", v)} /><Field label="Lavozimi" value={row.title} onChange={v => update("title", v)} /></div>
        <div className="grid grid-cols-4 gap-4">{([["total", "Jami"], ["resolved", "Hal etilgan"], ["inProgress", "Jarayonda"], ["overdue", "Muddati o‘tgan"]] as const).map(([key, label]) => <Field key={key} label={label} numeric value={row[key]} onChange={v => update(key, v === "" ? 0 : Number(v))} />)}</div>
      </section>
    })}
  </EditorFrame>
}

export function BirthdayEditor() {
  const [initial] = useState(() => getDraft("birthday"))
  const [draft, setDraft] = useState(initial)
  const photo = useMediaUrl(draft.photoPath)
  const valid = !draft.enabled || !!(draft.name.trim() && draft.department.trim() && draft.message.trim() && draft.photoPath)
  const actions = useDraftPublish("birthday", draft, valid)
  return <EditorFrame title="Tug‘ilgan kun tabrigi" actions={<DraftPublishActions state={actions} />}>
    <Enabled checked={draft.enabled} onChange={enabled => setDraft({ ...draft, enabled })} />
    <p className="text-sm text-slate-500">Tabrik slaydi yoqilgan paytda namoyish etiladi. Bayram tugagach, uni o‘chirib e’lon qiling.</p>
    {!valid && <p role="alert" className="text-sm text-red-700">Slaydni yoqish uchun ism, bo‘lim, tabrik matni va rasmni kiriting.</p>}
    <section className={panel}><Field label="Ism familiya" value={draft.name} onChange={name => setDraft({ ...draft, name })} /><Field label="Bo‘lim" value={draft.department} onChange={department => setDraft({ ...draft, department })} /><Field label="Tabrik matni" multiline value={draft.message} onChange={message => setDraft({ ...draft, message })} />
      <div className="flex items-end gap-8">{photo.url && <img src={photo.url} alt={draft.name || "Xodim rasmi"} className="h-56 w-44 rounded-xl object-cover object-top" />}<div className="max-w-sm"><ImageUploadControl upload={uploadBirthdayPhoto} onUploaded={photoPath => setDraft({ ...draft, photoPath })} hasPendingImage={draft.photoPath !== initial.photoPath} /></div></div>
    </section>
  </EditorFrame>
}

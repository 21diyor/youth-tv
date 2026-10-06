import {useEffect,useState} from "react"
import {Plus,UserRound,CheckCircle2,CalendarDays} from "lucide-react"
import {emptyHrPayload,loadHrPlans,saveHrPlan,publishHrPlan,type HrPlan,type HrPayload} from "@/data/hrPlans"
import {uploadBirthdayPhoto,useMediaUrl} from "@/data/media"
import {ImageUploadControl} from "./ImageUploadControl"

const months=["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"]
const inputClass="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3"
function validDate(kind:HrPlan["kind"],value:string) {
 if(kind==="employee")return /^(20[2-9][0-9]|21[0-9]{2}|2200)-(0[1-9]|1[0-2])$/.test(value)
 if(!/^\d{2}-\d{2}$/.test(value))return false
 const [month,day]=value.split("-").map(Number),d=new Date(Date.UTC(2000,month-1,day))
 return d.getUTCMonth()===month-1&&d.getUTCDate()===day
}
function Portrait({path,name,large=false}:{path:string|null;name:string;large?:boolean}) {
 const photo=useMediaUrl(path)
 return <div className={large?"h-64 w-48 shrink-0 overflow-hidden rounded-2xl bg-slate-100":"h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100"}>
 {photo.url?<img src={photo.url} alt={name} className="h-full w-full object-cover object-top"/>:<div className="flex h-full items-center justify-center text-slate-400">{photo.loading?<span className="text-xs">…</span>:<UserRound/>}</div>}
 {photo.failed&&<span className="text-xs text-red-700">Rasm yuklanmadi</span>}</div>
}
export function ScheduledHrEditor({mode,onOpenStaff}:{mode:"staff"|"birthday"|"employee";onOpenStaff?:()=>void}) {
 const kind=mode==="employee"?"employee":"birthday"
 const [staff,setStaff]=useState<HrPlan[]>([]),[records,setRecords]=useState<HrPlan[]>([])
 const [selected,setSelected]=useState<HrPlan|null>(null),[draft,setDraft]=useState<HrPayload>(emptyHrPayload)
 const [loading,setLoading]=useState(true),[saving,setBusy]=useState(false),[uploading,setUploading]=useState(false)
 const [error,setError]=useState(""),[message,setMessage]=useState(""),[search,setSearch]=useState("")
 const busy=saving||uploading
 useEffect(()=>{
  let cancelled=false
  Promise.all([loadHrPlans(kind),loadHrPlans("birthday")]).then(([rows,people])=>{
   if(cancelled)return
   setStaff(people);setRecords(rows);setSelected(rows[0]??null);setDraft(rows[0]?.draft??emptyHrPayload())
  }).catch(()=>{if(!cancelled)setError("Ma’lumotlar yuklanmadi. Sahifani yangilang.")}).finally(()=>{if(!cancelled)setLoading(false)})
  return()=>{cancelled=true}
 },[kind])
 const person=mode==="employee"?staff.find(p=>p.id===draft.staffId):null
 const profile=person?.draft??draft
 const payload=mode==="employee"&&person?{...draft,name:profile.name,position:profile.position,department:profile.department,photoPath:profile.photoPath}:draft
 const dirty=JSON.stringify(draft)!==JSON.stringify(selected?.draft??emptyHrPayload())
 const valid=validDate(kind,payload.dateKey)&&!!payload.name.trim()&&!!payload.photoPath
  &&(kind==="birthday"?!!payload.message.trim():!!person&&!!payload.position.trim()&&!!payload.recognition.trim())
 const canSave=!!payload.name.trim()&&(!payload.dateKey||validDate(kind,payload.dateKey))
 const choose=(row:HrPlan|null)=>{
  if(dirty&&!window.confirm("Saqlanmagan o‘zgarishlar bekor qilinsinmi?"))return
  setSelected(row);setDraft(row?.draft??{...emptyHrPayload(),dateKey:mode==="employee"?nextMonth():""});setError("");setMessage("")
 }
 const update=(key:keyof HrPayload,value:string|boolean|null)=>setDraft(current=>({...current,[key]:value}))
 const accept=(row:HrPlan)=>{setSelected(row);setDraft(row.draft);setRecords(current=>[row,...current.filter(r=>r.id!==row.id)])}
 const save=async(publish:boolean)=>{
  if(busy)return
  setBusy(true);setError("");setMessage("")
  try {
   const saved=await saveHrPlan(selected?.id??null,kind,payload);accept(saved)
   if(publish || kind==="birthday"&&(valid||!payload.enabled)) {
    accept(await publishHrPlan(saved.id))
    setMessage(kind==="birthday"?"Saqlandi. Xodim rasmi va ma’lumoti bog‘langan slaydlarda yangilanadi. Tabrik belgilangan kuni chiqadi.":"Reja saqlandi va e’lon qilindi. TV tanlangan oyda avtomatik ko‘rsatadi.")
   } else setMessage(mode==="staff"?"Xodim saqlandi. Avtomatik tabrik uchun tug‘ilgan sana va rasmni to‘ldiring.":"Qoralama saqlandi. Tayyor bo‘lganda e’lon qiling.")
  } catch(err) {
   const code=(err as {code?:string}).code
   setError(code==="23505"?"Bu xodim shu oy uchun allaqachon e’lon qilingan. Uning mavjud yozuvini tahrirlang.":"Saqlab bo‘lmadi. Sana, xodim va majburiy maydonlarni tekshiring.")
  } finally {setBusy(false)}
 }
 const currentMonth=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tashkent",year:"numeric",month:"2-digit"}).formatToParts(new Date())
 const monthKey=currentMonth.find(p=>p.type==="year")?.value+"-"+currentMonth.find(p=>p.type==="month")?.value
 const nextMonth=()=>selected?.draft.dateKey||monthKey
 const rowStatus=(row:HrPlan)=>kind==="birthday"?(row.published?.enabled?"Avtomatik tabrik yoqilgan":"Tabrik yoqilmagan"):
  !row.published?.enabled?"Qoralama":row.published.dateKey===monthKey?"TV: joriy oy":row.published.dateKey>monthKey?"Kelgusi oyga e’lon qilingan":"Oldingi oy"
 const displayedName=(row:HrPlan)=>kind==="employee"?staff.find(p=>p.id===row.draft.staffId)?.draft.name||row.draft.name:row.draft.name
 const missing=mode==="employee"&&!person?"Ro‘yxatdan xodimni tanlang. Eski yozuvdagi ismning o‘zi yetarli emas.":
  !validDate(kind,payload.dateKey)?"Sanani tanlang.":!payload.photoPath?"Xodimlar bo‘limida rasm yuklang.":
  !payload.position&&kind==="employee"?"Xodimlar bo‘limida lavozimni kiriting.":kind==="employee"&&!payload.recognition.trim()?"E’tirof sababini kiriting.":"Ma’lumotlarni to‘ldiring."
 if(loading)return <p role="status">Yuklanmoqda…</p>
 return <div>
 <header className="mb-7 flex flex-wrap items-start justify-between gap-5"><div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-700">HR bo‘limi</p><h3 className="text-3xl font-semibold">{mode==="staff"?"Xodimlar":mode==="birthday"?"Tug‘ilgan kunlar":"Oy xodimlari"}</h3><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">{mode==="staff"?"Ism, lavozim, bo‘lim, tug‘ilgan sana va rasm — bir joyda. Saqlangan ma’lumot oy xodimi va tabriklarda avtomatik ishlatiladi.":mode==="birthday"?"Xodimni tanlang, tabrik matnini yozing va avtomatik tabrikni yoqing. Tabrik har yili tug‘ilgan kuni Toshkent vaqti bilan chiqadi.":"Xodimni ro‘yxatdan tanlang, oy va e’tirof sababini belgilang. Bir oyga bir nechta xodim qo‘shing. TV avval umumiy, keyin har bir xodim slaydini ko‘rsatadi. Kelgusi oylarni oldindan tayyorlang."}</p></div>
 {mode!=="birthday"?<button disabled={busy} onClick={()=>choose(null)} className="flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white"><Plus size={20}/>{mode==="staff"?"Xodim qo‘shish":"Oyga xodim qo‘shish"}</button>:<button onClick={onOpenStaff} className="rounded-lg border px-4 py-3">Xodimlar ro‘yxatini ochish</button>}</header>
 <div role="status" className="mb-4 text-sm"><span className="text-red-700">{error}</span><span className="text-emerald-700">{message}</span></div>
 <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
 <aside><input aria-label="Xodim qidirish" className={inputClass+" mb-4"} placeholder="Ism yoki oy bo‘yicha qidirish…" value={search} onChange={e=>setSearch(e.target.value)}/>
 <div className="max-h-64 space-y-2 overflow-y-auto xl:max-h-[75vh]">{records.filter(r=>(displayedName(r)+" "+r.draft.dateKey).toLowerCase().includes(search.toLowerCase())).map(row=>{
 const linked=kind==="employee"?staff.find(p=>p.id===row.draft.staffId)?.draft:row.draft
 return <button disabled={busy} key={row.id} onClick={()=>choose(row)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${selected?.id===row.id?"border-blue-500 bg-[#F0F4FF]":"border-slate-200 bg-white"}`}><Portrait path={linked?.photoPath??row.draft.photoPath} name={displayedName(row)}/><span className="min-w-0"><strong className="block text-sm">{displayedName(row)||"Yangi yozuv"}</strong><small className="mt-1 block text-slate-500">{row.draft.dateKey||"Sana belgilanmagan"} · {rowStatus(row)}</small></span></button>
 })}</div>{!records.length&&<p className="p-4 text-sm text-slate-500">{mode==="birthday"?"Avval Xodimlar bo‘limida xodim qo‘shing.":"Hozircha yozuv yo‘q."}</p>}</aside>
 {(mode!=="birthday"||selected)&&<fieldset disabled={busy} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
 <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b pb-5"><h4 className="text-lg font-semibold">{mode==="staff"?"Xodim ma’lumotlari":mode==="birthday"?"Tabrik sozlamalari":"Oylik reja"}</h4><div className="flex gap-2"><button disabled={!canSave||busy} onClick={()=>save(false)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Saqlash</button>{mode==="employee"&&<button disabled={busy||!canSave||(payload.enabled&&!valid)} onClick={()=>save(true)} className="rounded-lg bg-blue-700 px-4 py-2 text-white disabled:opacity-40">Saqlash va e’lon qilish</button>}</div></div>
 {mode==="employee"&&<div className="mb-6 grid gap-5 md:grid-cols-2"><label>Ko‘rsatiladigan oy<input aria-label="Ko‘rsatiladigan oy" type="month" min="2020-01" max="2200-12" className={inputClass} value={draft.dateKey} onChange={e=>update("dateKey",e.target.value)}/></label><label>Xodimni tanlang<select aria-label="Xodimni tanlang" className={inputClass} value={draft.staffId??""} onChange={e=>update("staffId",e.target.value)}><option value="">Ro‘yxatdan tanlang</option>{staff.map(p=><option key={p.id} value={p.id}>{p.draft.name}</option>)}</select></label></div>}
 <div className="flex flex-wrap gap-7 rounded-xl bg-slate-50 p-5"><Portrait path={mode==="employee"&&!person?null:profile.photoPath} name={profile.name} large/><div className="min-w-[200px] flex-1">
 {mode==="staff"?<><label className="block">Ism familiya<input className={inputClass} maxLength={200} value={draft.name} onChange={e=>update("name",e.target.value)}/></label><label className="mt-4 block">Lavozimi<input className={inputClass} maxLength={200} value={draft.position} onChange={e=>update("position",e.target.value)}/></label><label className="mt-4 block">Bo‘lim<input className={inputClass} maxLength={300} value={draft.department} onChange={e=>update("department",e.target.value)}/></label></>:<><h4 className="text-xl font-semibold">{person||mode==="birthday"?profile.name:"Xodim tanlanmagan"}</h4><p className="mt-2 text-slate-600">{person||mode==="birthday"?profile.position:""}</p><p className="mt-2 text-sm text-slate-500">{person||mode==="birthday"?profile.department:""}</p><button onClick={onOpenStaff} className="mt-5 text-sm font-semibold text-blue-700">Rasm va ma’lumotni Xodimlar bo‘limida tahrirlash →</button>{mode==="birthday"&&<p className="mt-5 flex items-center gap-2"><CalendarDays size={18}/>{draft.dateKey||"Tug‘ilgan sana belgilanmagan"}</p>}</>}
 </div></div>
 {mode==="staff"&&<><div className="my-5"><ImageUploadControl onUploadingChange={setUploading} upload={uploadBirthdayPhoto} onUploaded={path=>update("photoPath",path)} hasPendingImage={!!draft.photoPath&&draft.photoPath!==selected?.draft.photoPath}/></div><h4 className="mt-7 font-semibold">Tug‘ilgan sana</h4><div className="mt-3 grid grid-cols-2 gap-4"><label>Oy<select aria-label="Tug‘ilgan oy" className={inputClass} value={draft.dateKey.split("-")[0]||""} onChange={e=>update("dateKey",e.target.value+"-"+(draft.dateKey.split("-")[1]||"01"))}><option value="">Tanlang</option>{months.map((m,i)=><option key={m} value={String(i+1).padStart(2,"0")}>{m}</option>)}</select></label><label>Kun<select aria-label="Tug‘ilgan kun" className={inputClass} value={draft.dateKey.split("-")[1]||""} onChange={e=>update("dateKey",(draft.dateKey.split("-")[0]||"01")+"-"+e.target.value)}><option value="">Tanlang</option>{Array.from({length:31},(_,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{i+1}</option>)}</select></label></div><p className="mt-4 text-sm text-slate-500">Tabrik matni va uni yoqish/o‘chirish “Tug‘ilgan kunlar” bo‘limida. 29-fevral tabrigi faqat kabisa yilida chiqadi.</p></>}
 {mode!=="staff"&&<><label className="my-6 flex items-center gap-3"><input type="checkbox" checked={draft.enabled} onChange={e=>update("enabled",e.target.checked)}/>{mode==="birthday"?"Avtomatik tabrik yoqilgan":"Reja faol"}</label><label className="block">{mode==="birthday"?"Tabrik matni":"E’tirof sababi"}<textarea className={inputClass} rows={5} maxLength={1000} value={mode==="birthday"?draft.message:draft.recognition} onChange={e=>update(mode==="birthday"?"message":"recognition",e.target.value)}/></label>{!valid&&draft.enabled&&<p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{missing}</p>}{selected?.published&&<p className="mt-5 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 size={16}/>{rowStatus(selected)} · {selected.published.dateKey}</p>}</>}
 {mode==="employee"&&<p className="mt-5 text-sm text-slate-500">Rasm va lavozim tanlangan xodim profilidan avtomatik olinadi. Kelgusi oy e’lonlari o‘z oyida ko‘rinadi.</p>}
 </fieldset>}</div></div>
}

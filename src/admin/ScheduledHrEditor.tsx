import {useEffect,useState} from "react"
import { useTashkentDate } from "@/hooks/useTashkentDate"
import {Plus} from "lucide-react"
import {emptyHrPayload,loadHrPlans,saveHrPlan,publishHrPlan,type HrPlan,type HrPayload} from "@/data/hrPlans"
import {uploadBirthdayPhoto,useMediaUrl} from "@/data/media"
import {ImageUploadControl} from "./ImageUploadControl"

const months=["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"]
const inputClass="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3"
function validDate(kind:HrPlan["kind"],value:string) {
  if(kind==="employee")return /^(20[2-9][0-9]|21[0-9]{2}|2200)-(0[1-9]|1[0-2])$/.test(value)
  if(!/^\d{2}-\d{2}$/.test(value))return false
  const [month,day]=value.split("-").map(Number)
  const d=new Date(Date.UTC(2000,month-1,day))
  return d.getUTCMonth()===month-1 && d.getUTCDate()===day
}
export function ScheduledHrEditor({kind}:{kind:HrPlan["kind"]}) {
  useTashkentDate()
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tashkent",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date())
  const datePart=(type:string)=>parts.find(p=>p.type===type)?.value??""
  const today=`${datePart("month")}-${datePart("day")}`
  const thisMonth=`${datePart("year")}-${datePart("month")}`
  const status=(row:HrPlan)=>!row.published?.enabled ? "Avtomatik ko‘rsatish yoqilmagan" : kind==="birthday" ? (row.published.dateKey===today?"Bugungi tabrik":"Har yili "+row.published.dateKey) : row.published.dateKey===thisMonth?"Joriy oy":row.published.dateKey>thisMonth?"Kelgusi oyga rejalangan":"Oldingi oy"
  const [staff,setStaff]=useState<HrPlan[]>([])
  const [records,setRecords]=useState<HrPlan[]>([])
  const [selected,setSelected]=useState<HrPlan|null>(null)
  const [draft,setDraft]=useState<HrPayload>(emptyHrPayload)
  const [loading,setLoading]=useState(true)
  const [saving,setBusy]=useState(false)
  const [uploading,setUploading]=useState(false)
  const busy=saving||uploading
  const [error,setError]=useState("")
  const [message,setMessage]=useState("")
  const [search,setSearch]=useState("")
  const photo=useMediaUrl(draft.photoPath)
  useEffect(()=>{
    let cancelled=false
    Promise.all([loadHrPlans(kind),loadHrPlans("birthday")]).then(([rows,people])=>{
      if(cancelled)return
      setStaff(people)
      setRecords(rows);setSelected(rows[0]??null);setDraft(rows[0]?.draft??emptyHrPayload())
    }).catch(()=>{if(!cancelled)setError("Ma’lumotlar yuklanmadi. Sahifani yangilang.")})
      .finally(()=>{if(!cancelled)setLoading(false)})
    return()=>{cancelled=true}
  },[kind])
  const dirty=JSON.stringify(draft)!==JSON.stringify(selected?.draft??emptyHrPayload())
  const valid=validDate(kind,draft.dateKey) && !!draft.name.trim() && !!draft.photoPath
    && (kind==="birthday" ? !!draft.message.trim() : !!draft.staffId && !!draft.position.trim() && !!draft.recognition.trim())
  const canSave=(!draft.dateKey || validDate(kind,draft.dateKey))
  const choose=(row:HrPlan|null)=>{
    if(dirty && !window.confirm("Saqlanmagan o‘zgarishlar bekor qilinsinmi?"))return
    setSelected(row);setDraft(row?.draft??emptyHrPayload());setError("");setMessage("")
  }
  const update=(key:keyof HrPayload,value:string|boolean|null)=>setDraft(current=>({...current,[key]:value}))
  const accept=(row:HrPlan)=>{
    setSelected(row);setDraft(row.draft)
    setRecords(current=>[row,...current.filter(r=>r.id!==row.id)])
  }
  const perform=async(action:"save"|"publish")=>{
    setBusy(true);setError("");setMessage("")
    try{
      if(action==="save"){
        const saved=await saveHrPlan(selected?.id??null,kind,draft)
        accept(saved)
        if(kind==="birthday" && (valid || !draft.enabled)) {
          accept(await publishHrPlan(saved.id))
          setMessage("Xodim saqlandi. Tabrik tug‘ilgan kuni avtomatik chiqadi (agar yoqilgan bo‘lsa).")
        } else setMessage(kind==="birthday" ? "Xodim saqlandi. Avtomatik tabrik uchun tug‘ilgan sana, rasm va matnni to‘ldiring." : "Qoralama saqlandi. Rejaga qo‘shish uchun e’lon qiling.")
      }
      else if(selected){accept(await publishHrPlan(selected.id));setMessage("E’lon qilindi. TV belgilangan sanada avtomatik ko‘rsatadi.")}
    }catch(err){
      const code=(err as {code?:string}).code
      setError(code==="23505" ? "Bu oy uchun xodim allaqachon e’lon qilingan. O‘sha yozuvni tahrirlang yoki avval uni o‘chiring." : "Saqlash amalga oshmadi. Sana va majburiy maydonlarni tekshiring.")
    }finally{setBusy(false)}
  }
  if(loading)return <p role="status">Yuklanmoqda…</p>
  return <div>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-6"><div><h3 className="text-3xl font-semibold">{kind==="birthday"?"Xodimlar ro‘yxati":"Oy xodimi — reja"}</h3>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">{kind==="birthday"
        ?"Xodim ma’lumotlarini bir marta kiriting va saqlang. Shu ro‘yxatdan oy xodimi ham tanlanadi. Tabrik har yili faqat shu kuni Toshkent vaqti bilan chiqadi. 29-fevral faqat kabisa yilida ko‘rsatiladi."
        :"Ro‘yxatdan xodimni tanlang, oy va e’tirof sababini kiriting. Kelgusi oylarni ham oldindan saqlab, e’lon qilish mumkin. TV faqat joriy oy yozuvini ko‘rsatadi; oy almashganda avtomatik yangilanadi."}</p></div>
      <button disabled={busy} onClick={()=>choose(null)} className="flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white"><Plus size={20}/>{kind==="birthday"?"Xodim qo‘shish":"Oy qo‘shish"}</button>
    </div>
    <div role="status" className="mb-4 text-sm"><span className="text-red-600">{error}</span><span className="text-emerald-700">{message}</span></div>
    <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)] gap-6">
      <aside className="space-y-3"><input aria-label="Xodim qidirish" className={inputClass} placeholder="Qidirish…" value={search} onChange={e=>setSearch(e.target.value)}/>
        {records.filter(r=>(r.draft.name+" "+r.draft.dateKey).toLowerCase().includes(search.toLowerCase())).map(row=><button disabled={busy} key={row.id} onClick={()=>choose(row)} className={`w-full rounded-xl border p-4 text-left ${selected?.id===row.id?"border-blue-500 bg-[#F0F4FF]":"border-slate-200 bg-white"}`}>
          <strong className="block">{row.draft.name||"Yangi xodim"}</strong><span className="mt-2 block text-sm text-slate-500">{row.draft.dateKey||"Sana kerak"} · {status(row)}</span>
        </button>)}
        {!records.length&&<p className="text-sm text-slate-500">Hozircha yozuv yo‘q. + tugmasini bosing.</p>}
      </aside>
      <fieldset disabled={busy} className="min-w-0 space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex justify-between gap-4"><label className="flex items-center gap-2"><input type="checkbox" checked={draft.enabled} onChange={e=>update("enabled",e.target.checked)}/>{kind==="birthday"?"Avtomatik tug‘ilgan kun tabrigi":"Rejada faol"}</label>
          <div className="flex gap-3"><button disabled={busy||!canSave} onClick={()=>perform("save")} className="rounded-lg border px-4 py-2 disabled:opacity-40">Saqlash</button>{kind==="employee"&&<button disabled={busy||!selected||dirty||(draft.enabled&&!valid)} onClick={()=>perform("publish")} className="rounded-lg bg-blue-700 px-4 py-2 text-white disabled:opacity-40">E’lon qilish</button>}</div>
        </div>
        {kind==="employee"?<label className="block">Ko‘rsatiladigan oy<input aria-label="Ko‘rsatiladigan oy" type="month" min="2020-01" max="2200-12" className={inputClass} value={draft.dateKey} onChange={e=>update("dateKey",e.target.value)}/></label>
          :<div className="grid grid-cols-2 gap-4"><label>Oy<select aria-label="Tug‘ilgan oy" className={inputClass} value={draft.dateKey.split("-")[0]||""} onChange={e=>update("dateKey",e.target.value+"-"+(draft.dateKey.split("-")[1]||"01"))}><option value="">Tanlang</option>{months.map((m,i)=><option key={m} value={String(i+1).padStart(2,"0")}>{m}</option>)}</select></label>
          <label>Kun<select aria-label="Tug‘ilgan kun" className={inputClass} value={draft.dateKey.split("-")[1]||""} onChange={e=>update("dateKey",(draft.dateKey.split("-")[0]||"01")+"-"+e.target.value)}><option value="">Tanlang</option>{Array.from({length:31},(_,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{i+1}</option>)}</select></label></div>}
        {kind==="employee"&&<label className="block">Xodimni tanlang<select aria-label="Xodimni tanlang" className={inputClass} value={draft.staffId??""} onChange={e=>{const person=staff.find(s=>s.id===e.target.value);setDraft(current=>({...current,staffId:e.target.value,name:person?.draft.name??"",position:person?.draft.position??"",department:person?.draft.department??"",photoPath:person?.draft.photoPath??null}))}}><option value="">Ro‘yxatdan tanlang</option>{staff.map(person=><option key={person.id} value={person.id}>{person.draft.name||"Ismsiz xodim"}</option>)}</select><span className="mt-2 block text-sm text-slate-500">Ma’lumot va rasm “Xodimlar va tug‘ilgan kunlar” bo‘limida tahrirlanadi.</span></label>}
        {(["name","position","department"] as const).map(key=><label key={key} className="block">{({name:"Ism familiya",position:"Lavozimi",department:"Bo‘lim"})[key]}<input readOnly={kind==="employee"} className={inputClass} maxLength={200} value={draft[key]} onChange={e=>update(key,e.target.value)}/></label>)}
        <label className="block">{kind==="birthday"?"Tabrik matni":"E’tirof sababi"}<textarea className={inputClass} rows={4} maxLength={500} value={kind==="birthday"?draft.message:draft.recognition} onChange={e=>update(kind==="birthday"?"message":"recognition",e.target.value)}/></label>
        <div className="flex items-center gap-6">{photo.url&&<img src={photo.url} alt={draft.name} className="h-52 w-40 rounded-xl object-cover object-top"/>}{kind==="birthday"&&<div className="min-w-0 flex-1"><ImageUploadControl onUploadingChange={setUploading} upload={uploadBirthdayPhoto} onUploaded={path=>update("photoPath",path)} hasPendingImage={!!draft.photoPath && draft.photoPath!==selected?.draft.photoPath}/></div>}</div>
        {!valid&&<p className="text-sm text-slate-500">E’lon qilish uchun sana, ism, rasm va matnni to‘ldiring. Qoralamani oldindan saqlash mumkin.</p>}
        <p className="text-sm text-slate-500">Avtomatik ko‘rsatish Toshkent sanasi bo‘yicha ishlaydi. Kelgusi oy yozuvlari va boshqa kunlardagi tabriklar hozir TVda ko‘rsatilmaydi.</p>
      </fieldset>
    </div>
  </div>
}

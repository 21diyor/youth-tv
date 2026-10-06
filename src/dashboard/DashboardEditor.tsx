import {useEffect,useState} from 'react'
import {Plus,Save,Send,RefreshCw} from 'lucide-react'
import {getSupabase} from '@/lib/supabase'
import {groups,fullNumber,type EditableReport,type DirectorReport} from './model'
import type {Json} from '@/types/database'

export function DashboardEditor(){
 const [records,setRecords]=useState<EditableReport[]>([])
 const [selected,setSelected]=useState<EditableReport|null>(null)
 const [draft,setDraft]=useState<DirectorReport|null>(null)
 const [section,setSection]=useState('')
 const [busy,setBusy]=useState(false)
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 const [message,setMessage]=useState('')
 const [refresh,setRefresh]=useState(0)
 useEffect(()=>{let cancelled=false;getSupabase().from('dashboard_reports').select('*').order('updated_at',{ascending:false}).then(({data,error})=>{if(cancelled)return;if(error)setError('Hisobotlar yuklanmadi.');else{const rows=data as unknown as EditableReport[];setRecords(rows);setSelected(rows[0]??null);setDraft(rows[0]?.draft??null);setSection(rows[0]?.draft.sections[0]?.id??'');setError('')}setLoading(false)});return()=>{cancelled=true}},[refresh])
 const dirty=!!draft && JSON.stringify(draft)!==JSON.stringify(selected?.draft)
 const canLeave=()=>!dirty||window.confirm('Saqlanmagan o‘zgarishlar bekor qilinsinmi?')
 const choose=(id:string)=>{if(!canLeave())return;const row=records.find(r=>r.id===id);if(!row)return;setSelected(row);setDraft(row.draft);setSection(row.draft.sections[0].id);setError('');setMessage('')}
 const accept=(row:EditableReport)=>{setSelected(row);setDraft(row.draft);setRecords(old=>[row,...old.filter(r=>r.id!==row.id)])}
 const perform=async(publish:boolean)=>{
  if(!draft||busy)return
  setBusy(true);setError('');setMessage('')
  try{
   const result=publish&&selected?await getSupabase().rpc('publish_dashboard_report',{report_id:selected.id,expected_version:selected.version}):await getSupabase().rpc('save_dashboard_report',{report_id:selected?.id??null,expected_version:selected?.version??0,payload:draft as unknown as Json})
   if(result.error)throw result.error
   accept(result.data as unknown as EditableReport)
   setMessage(publish?'Hisobot e’lon qilindi. Rahbar paneli bir daqiqa ichida yangilanadi.':'Qoralama saqlandi. Rahbar ko‘rishi uchun e’lon qiling.')
  }catch(e){const code=(e as {code?:string}).code;setError(code==='40001'?'Boshqa tahrir saqlangan. Qayta yuklang va o‘zgarishlarni tekshiring.':code==='23505'?'Ushbu sana uchun hisobot mavjud. Uni ro‘yxatdan tanlang.':'Saqlab bo‘lmadi. Sana va sonlarni tekshiring.')}
  finally{setBusy(false)}
 }
 const newReport=()=>{if(!draft||!canLeave())return;const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const today=['year','month','day'].map(k=>parts.find(p=>p.type===k)?.value).join('-');setSelected(null);setDraft({...draft,asOf:today,source:'Qo‘lda kiritilgan hisobot',sourceHash:'',sourceText:'',sections:draft.sections.map(s=>({...s,note:'',metrics:s.metrics.map(m=>({...m,value:null,note:''}))}))});setMessage('Yangi hisobot: qiymatlar bo‘sh. Hisobot sanasi va har bir ko‘rsatkich davrini tekshiring.');setError('')}
 const active=draft?.sections.find(s=>s.id===section)??draft?.sections[0]
 const updateMetric=(id:string,key:'value'|'note'|'period',value:string|number|null)=>setDraft(r=>r?{...r,sections:r.sections.map(s=>({...s,metrics:s.metrics.map(m=>m.id===id?{...m,[key]:value}:m)}))}:r)
 const input='w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm'
 if(loading)return <p role="status">Hisobotlar yuklanmoqda…</p>
 if(!draft)return <div><p role="alert">{error||'Hisobot hali kiritilmagan.'}</p><button onClick={()=>setRefresh(n=>n+1)}>Qayta urinish</button></div>
 return <div><div className="flex flex-wrap items-start justify-between gap-5"><div><h3 className="text-3xl font-semibold">Rahbar paneli — ma’lumotlar</h3><p className="mt-2 max-w-2xl text-sm text-slate-500">Qoralamani tahrirlang, saqlang va e’lon qiling. Rahbar faqat e’lon qilingan hisobotni ko‘radi. Bo‘sh qiymat — ma’lumot yo‘q; nol — haqiqiy nol.</p></div><button disabled={busy} onClick={newReport} className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-white"><Plus size={18}/>Yangi hisobot</button></div>
 <div role="status" className="my-4 text-sm"><span className="text-red-600">{error}</span><span className="text-emerald-700">{message}</span></div>
 <fieldset disabled={busy} className="min-w-0"><div className="mb-6 flex flex-wrap gap-3"><select aria-label="Tahrirlanadigan hisobot" className={input+' max-w-sm'} value={selected?.id??''} onChange={e=>choose(e.target.value)}>{!selected&&<option value="">Yangi hisobot</option>}{records.map(r=><option key={r.id} value={r.id}>{r.draft.asOf} · {r.published?'E’lon qilingan':'Qoralama'}</option>)}</select><button onClick={()=>{if(canLeave())setRefresh(n=>n+1)}} className="rounded-lg border p-3" aria-label="Hisobotlarni qayta yuklash"><RefreshCw size={18}/></button><button onClick={()=>perform(false)} className="flex items-center gap-2 rounded-lg border px-4 py-2"><Save size={16}/>Saqlash</button><button disabled={!selected||dirty} onClick={()=>perform(true)} className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-white disabled:opacity-40"><Send size={16}/>E’lon qilish</button></div>
 <section className="mb-6 grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-3"><label className="text-sm">Hisobot sanasi<input type="date" className={input+' mt-2'} value={draft.asOf} onChange={e=>setDraft({...draft,asOf:e.target.value})}/></label><label className="text-sm">Hisobot nomi<input className={input+' mt-2'} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label><label className="text-sm">Manba<input className={input+' mt-2'} value={draft.source} onChange={e=>setDraft({...draft,source:e.target.value})}/></label></section>
 <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)]"><aside className="space-y-4">{groups.map(g=><div key={g.id}><h4 className="mb-2 text-xs font-semibold text-slate-500">{g.label}</h4>{draft.sections.filter(s=>s.group===g.id).map(s=><button className={`mb-1 block w-full rounded-lg border p-3 text-left text-sm ${active?.id===s.id?'bg-[#F0F4FF] border-blue-500':'bg-white border-slate-200'}`} key={s.id} onClick={()=>setSection(s.id)}>{s.title}</button>)}</div>)}</aside><section className="min-w-0 rounded-xl border bg-white p-5"><h4 className="text-xl font-semibold">{active?.title}</h4><p className="mt-1 text-xs text-slate-500">{active?.sourceSection}</p><label className="my-5 block text-sm">Bo‘lim izohi<textarea className={input+' mt-2'} rows={3} value={active?.note??''} onChange={e=>setDraft({...draft,sections:draft.sections.map(s=>s.id===active?.id?{...s,note:e.target.value}:s)})}/></label><div className="space-y-5">{active?.metrics.map(m=><div key={m.id} className="border-t border-slate-100 pt-4"><label className="block text-sm font-medium">{m.label} <span className="font-normal text-slate-500">({m.unit})</span><input aria-label={m.label} className={input+' mt-2'} type="number" min="0" step="any" value={m.value??''} placeholder="Ma’lumot yo‘q" onChange={e=>updateMetric(m.id,'value',e.target.value===''?null:Number(e.target.value))}/></label><div className="mt-2 grid gap-3 md:grid-cols-2"><label className="text-xs text-slate-500">Ko‘rsatkich davri<input className={input+' mt-1'} value={m.period} onChange={e=>updateMetric(m.id,'period',e.target.value)}/></label><label className="text-xs text-slate-500">Izoh<input className={input+' mt-1'} value={m.note} onChange={e=>updateMetric(m.id,'note',e.target.value)}/></label></div><p className="mt-1 text-xs text-slate-400">Ko‘rinishi: {fullNumber(m.value)} {m.unit}</p></div>)}</div></section></div></fieldset></div>
}

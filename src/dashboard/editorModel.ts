import type {DirectorReport,Metric} from './model'
export function moveItem<T>(items:T[],index:number,direction:number):T[]{
 const next=index+direction
 if(index<0||next<0||next>=items.length)return items
 const result=[...items];[result[index],result[next]]=[result[next],result[index]];return result
}
export function newMetric(period:string):Metric{return {id:crypto.randomUUID(),label:'Yangi ko‘rsatkich',value:null,unit:'nafar',period,note:''}}
export function emptyReport():DirectorReport{
 const asOf=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
 return {title:'Yangi hisobot',asOf,source:'Qo‘lda kiritilgan hisobot',sections:[{id:crypto.randomUUID(),title:'Yangi bo‘lim',group:'overview',note:'',sourceSection:'',metrics:[newMetric(asOf)]}]}
}
export function validateEditorReport(report:DirectorReport):string[]{
 const errors:string[]=[]
 if(!report.title.trim())errors.push('Hisobot nomini kiriting.')
 if(!/^\d{4}-\d{2}-\d{2}$/.test(report.asOf)||Number.isNaN(Date.parse(report.asOf)))errors.push('Hisobot sanasini kiriting.')
 if(!report.source.trim())errors.push('Manbani kiriting.')
 if(!report.sections.length)errors.push('Kamida bitta bo‘lim kerak.')
 if(report.presentation?.showOverview===false&&!report.sections.some(s=>s.visible!==false))errors.push('Kamida bitta slaydni yoqing.')
 const ids=new Set<string>()
 for(const s of report.sections){
  if(!s.title.trim()||!s.metrics.length)errors.push('Har bir bo‘limda nom va kamida bitta ko‘rsatkich bo‘lishi kerak.')
  for(const m of s.metrics){
   if(ids.has(m.id))errors.push('Takroriy ko‘rsatkich mavjud.');ids.add(m.id)
   if(!m.label.trim()||!m.unit.trim()||!m.period.trim())errors.push(`${s.title}: ko‘rsatkich nomi, birligi va davrini to‘ldiring.`)
   if(m.value!==null&&(!Number.isFinite(m.value)||m.value<0))errors.push(`${m.label}: qiymat nol yoki musbat son bo‘lishi kerak.`)
  }
 }
 return [...new Set(errors)]
}

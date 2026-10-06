export type Metric = { id: string; label: string; value: number | null; unit: string; period: string; note: string }
export type ReportSection = { id: string; title: string; group: string; sourceSection: string; note: string; metrics: Metric[] }
export type DirectorReport = { title: string; asOf: string; source: string; sourceHash?: string; sourceText?: string; sections: ReportSection[] }
export type PublishedReport = { id: string; report: DirectorReport; publishedAt: string }
export type EditableReport = { id: string; draft: DirectorReport; published: DirectorReport | null; version: number; published_at: string | null }
export const groups = [
 {id:'overview',label:'Umumiy ko‘rinish'}, {id:'education',label:'Ta’lim va infratuzilma'},
 {id:'employment',label:'Bandlik va yer'}, {id:'support',label:'Ijtimoiy ko‘mak'},
 {id:'migration',label:'Migratsiya'}, {id:'safety',label:'Huquqbuzarlik profilaktikasi'},
 {id:'projects',label:'Rivojlanish loyihalari'}, {id:'leaders',label:'Mahalla yetakchilari'},
]
export const fullNumber = (v: number | null | undefined) => v == null ? '—' : new Intl.NumberFormat('uz-UZ',{maximumFractionDigits:3}).format(v)
export function compact(v: number | null | undefined) {
 if(v==null)return '—'
 return v>=1e6 ? `${fullNumber(Math.round(v/1e4)/100)} mln` : v>=1e4 ? `${fullNumber(Math.round(v/100)/10)} ming` : fullNumber(v)
}
export const dateLabel = (s:string) => {
 const [year,month,day]=s.split('-').map(Number)
 const months=['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr']
 return `${day} ${months[month-1]??''} ${year}`
}
export function metricIndex(r: DirectorReport) {return Object.fromEntries(r.sections.flatMap(s=>s.metrics.map(m=>[m.id,{...m,section:s.title,sourceSection:s.sourceSection,sectionNote:s.note}])))}
export function percentage(n:number|null|undefined,d:number|null|undefined) {return n==null||d==null||d<=0?null:Math.round(n/d*1000)/10}

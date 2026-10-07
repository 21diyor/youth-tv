import type {DirectorReport, Metric, ReportSection} from './model'

export type DashboardSlide = {
 id:string; group:string; title:string; kind:'overview'|'balance'|'metrics'|'crime';
 metrics:Metric[]; note:string; sourceSection:string; page:number; pages:number
}
export function buildDashboardSlides(report:DirectorReport):DashboardSlide[] {
 const all=report.sections.flatMap(s=>s.metrics)
 const slides:DashboardSlide[]=[{id:'summary',group:'overview',title:'Respublika yoshlari',kind:'overview',metrics:all,note:'',sourceSection:'',page:1,pages:1}]
 for(const section of report.sections){
  if(!section.metrics.length)continue
  const special=section.id==='balance'&&['green','yellow','red'].every(id=>section.metrics.some(m=>m.id===id))?'balance':section.id==='crime'&&['crime25','crime26','minor_crime25','minor_crime26','offenders25','offenders26','minor25','minor26'].every(id=>section.metrics.some(m=>m.id===id))?'crime':null
  // Do not discard future, newly added metrics in a familiar section.
  if(special&&section.metrics.length===(special==='balance'?3:8)){
   slides.push(makeSlide(section,section.metrics,0,1,special));continue
  }
  const pages=Math.ceil(section.metrics.length/6)
  for(let page=0;page<pages;page++)slides.push(makeSlide(section,section.metrics.slice(page*6,page*6+6),page,pages,'metrics'))
 }
 return slides
}
function makeSlide(section:ReportSection,metrics:Metric[],page:number,pages:number,kind:DashboardSlide['kind']):DashboardSlide {
 return {id:`${section.id}-${page}`,group:section.group,title:section.title,kind,metrics,note:section.note,sourceSection:section.sourceSection,page:page+1,pages}
}
export function canCompare(metrics:Metric[]) {
 return metrics.length>1&&metrics.every(m=>m.unit===metrics[0].unit&&m.period===metrics[0].period&&(m.value==null||m.value>=0))
}
export function metricPeriod(period:string) {
 const range=/^(\d{4})-01\/\d{4}-05$/.exec(period)
 return range?`${range[1]} · yanvar–may`:period
}

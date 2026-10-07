import type {DirectorReport, Metric, ReportSection} from './model'

export type DashboardSlide = {
 id:string; group:string; title:string; kind:'overview'|'balance'|'metrics'|'crime';
 metrics:Metric[]; note:string; sourceSection:string; page:number; pages:number; duration?:number; chart?:'auto'|'bars'|'cards'; summaryMetricIds?:string[]
}
export function buildDashboardSlides(report:DirectorReport):DashboardSlide[] {
 const all=report.sections.flatMap(s=>s.metrics)
 const slides:DashboardSlide[]=report.presentation?.showOverview===false?[]:[{id:'summary',group:'overview',title:report.presentation?.title||'Respublika yoshlari',kind:'overview',metrics:all,note:'',sourceSection:'',page:1,pages:1,summaryMetricIds:report.presentation?.summaryMetricIds}]
 for(const section of report.sections){
  if(!section.metrics.length||section.visible===false)continue
  const special=section.id==='balance'&&['green','yellow','red'].every(id=>section.metrics.some(m=>m.id===id))?'balance':section.id==='crime'&&['crime25','crime26','minor_crime25','minor_crime26','offenders25','offenders26','minor25','minor26'].every(id=>section.metrics.some(m=>m.id===id))?'crime':null
  // Do not discard future, newly added metrics in a familiar section.
  if(special&&(!section.chart||section.chart==='auto')&&section.metrics.length===(special==='balance'?3:8)){
   slides.push(makeSlide(section,section.metrics,0,1,special));continue
  }
  const size=Math.max(2,Math.min(6,Math.round(section.pageSize||6)))
  const pages=Math.ceil(section.metrics.length/size)
  for(let page=0;page<pages;page++)slides.push(makeSlide(section,section.metrics.slice(page*size,page*size+size),page,pages,'metrics'))
 }
 return slides
}
function makeSlide(section:ReportSection,metrics:Metric[],page:number,pages:number,kind:DashboardSlide['kind']):DashboardSlide {
 return {id:`${section.id}-${page}`,group:section.group,title:section.title,kind,metrics,note:section.note,sourceSection:section.sourceSection,page:page+1,pages,duration:section.duration,chart:section.chart}
}
export function canCompare(metrics:Metric[]) {
 return metrics.length>1&&metrics.every(m=>m.unit===metrics[0].unit&&m.period===metrics[0].period&&(m.value==null||m.value>=0))
}
export function metricPeriod(period:string) {
 const range=/^(\d{4})-01\/\d{4}-05$/.exec(period)
 return range?`${range[1]} · yanvar–may`:period
}

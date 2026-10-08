import { awardMonthLabel } from "@/lib/awardMonth"
import type { HrSlide } from '@/data/hrPlans'
import { Portrait } from './Portrait'
import { TvFrame } from './TvFrame'

export function HrGroupSlide({people,birthday,page}:{people:HrSlide[];birthday:boolean;page:number}) {
  const visible=people.slice(page*6,page*6+6)
  const pages=Math.ceil(people.length/6)
  return <TvFrame title={birthday?'Bugungi tavallud ayyomlari':'Oy xodimlari'} celebration={birthday}>
    <div className="tv-group-caption">{birthday?'Tug‘ilgan kuningiz muborak!':`${awardMonthLabel(people[0]?.awardMonth)} · Fidoyilik va yuksak natijalar uchun e’tirof`}{pages>1&&<span>{page+1} / {pages}</span>}</div>
    <div className={`tv-hr-group ${visible.length>3?'tv-hr-group-many':''}`} style={{gridTemplateColumns:`repeat(${Math.min(visible.length,visible.length===5?5:3)},minmax(0,${visible.length===1?"560px":"1fr"}))`}}>
      {visible.map(person=><article key={person.id} className="tv-hr-group-card"><Portrait path={person.photoPath} name={person.name}/><h2>{person.name}</h2></article>)}
    </div>
  </TvFrame>
}

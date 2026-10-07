import {memo,useCallback,useEffect,useMemo,useRef,useState} from 'react'
import {ChevronLeft,ChevronRight,Pause,Play,Maximize,Minimize,LayoutGrid,Search,LogOut,Sun,Moon,X,Info,ArrowUpRight,RefreshCw} from 'lucide-react'
import {PieChart,Pie,Cell,ResponsiveContainer} from 'recharts'
import {useTvTheme} from '@/hooks/useTvTheme'
import {buildDashboardSlides,canCompare,metricPeriod,type DashboardSlide} from './presentationModel'
import {compact,dateLabel,fullNumber,groups,metricIndex,percentage,type Metric,type PublishedReport} from './model'
import './presentation.css'

const colors=['#2563eb','#10a889','#d99b20','#8970dc','#d86480','#3793ad']
type Inspect=(ids:string[])=>void
function MetricCard({metric,onInspect,index=0}:{metric:Metric;onInspect:Inspect;index?:number}) {
 return <button className={`ds-stat ds-stat-${index%4}`} onClick={()=>onInspect([metric.id])}><span>{metric.label}<ArrowUpRight size={24}/></span><strong>{compact(metric.value)}</strong><small>{metric.unit} · {metricPeriod(metric.period)}</small>{metric.value===null&&<em>Manbada qiymat berilmagan</em>}</button>
}
function Comparison({metrics,onInspect,title}:{metrics:Metric[];onInspect:Inspect;title?:string}) {
 const max=Math.max(1,...metrics.map(m=>m.value??0))
 return <section className="ds-panel ds-comparison">{title&&<h2>{title}</h2>}<div className="ds-chart-meta"><span>{metrics[0]?.unit}</span><span>{metricPeriod(metrics[0]?.period??'')}</span></div><div className="ds-bars">{metrics.map((m,i)=><button className="ds-bar" key={m.id} onClick={()=>onInspect([m.id])}><span className="ds-bar-label">{m.label}</span><span className="ds-bar-track"><i style={{width:`${Math.max(0,(m.value??0)/max*100)}%`,background:colors[i%colors.length]}}/></span><strong>{fullNumber(m.value)}</strong></button>)}</div><p className="ds-chart-hint">Har bir ko‘rsatkich alohida. Qiymatlar qo‘shib jamlanmagan.</p></section>
}
const SlideContent=memo(function SlideContent({slide,onInspect}:{slide:DashboardSlide;onInspect:Inspect}) {
 const index=Object.fromEntries(slide.metrics.map(m=>[m.id,m]))
 if(slide.kind==='overview'){
  const ids=['population','youth14','employed_total','crime26'].filter(id=>index[id])
  const ages=['youth0','youth7','youth14','youth18'].map(id=>index[id]).filter(Boolean)
  const rate=percentage(index.employed_total?.value,index.unemployed_total?.value)
  return <><div className="ds-stat-grid">{ids.map((id,i)=><MetricCard key={id} metric={index[id]} index={i} onInspect={onInspect}/>)}</div><div className="ds-overview-charts"><Comparison title="Yosh guruhlari" metrics={ages} onInspect={onInspect}/><section className="ds-panel ds-execution"><p>Bandlik ijrosi</p><button onClick={()=>onInspect(['employed_total','unemployed_total'])}><strong>{fullNumber(rate)}{rate!==null&&<small>%</small>}</strong><span>{fullNumber(index.employed_total?.value)} / {fullNumber(index.unemployed_total?.value)} nafar</span></button><div className="ds-meter"><i style={{width:`${Math.min(100,Math.max(0,rate??0))}%`}}/></div><p className="ds-chart-hint">Bandligi ta’minlangan yoshlar / ishsiz yoshlar balansi. Yosh guruhlari bir-birini qamrab oladi.</p></section></div></>
 }
 if(slide.kind==='balance'){
  const data=['green','yellow','red'].map((id,i)=>({...index[id],color:['#10a889','#e6ad28','#e36565'][i]}))
  const missing=data.some(m=>m.value==null),sum=data.reduce((n,m)=>n+(m.value??0),0)
  return <div className="ds-balance"><section className="ds-panel ds-ring"><h2>Yoshlar balansi</h2>{missing||sum<=0?<p className="ds-empty">Ulushlar uchun to‘liq, musbat jami kerak.</p>:<><ResponsiveContainer width="100%" height={450}><PieChart><Pie data={data} dataKey="value" innerRadius={135} outerRadius={190} stroke="none" paddingAngle={2} isAnimationActive={false} onClick={(_,i)=>onInspect([data[i].id])}>{data.map(m=><Cell key={m.id} fill={m.color}/>)}</Pie></PieChart></ResponsiveContainer><div className="ds-ring-total"><strong>{compact(sum)}</strong><span>uch toifa yig‘indisi · nafar</span></div></>}</section><section className="ds-balance-list">{data.map(m=><button key={m.id} onClick={()=>onInspect([m.id])} className="ds-panel"><i style={{background:m.color}}/><div><h2>{m.label}</h2><strong>{fullNumber(m.value)}</strong></div><span>{missing||sum<=0?'—':fullNumber(percentage(m.value,sum))+'%'}</span></button>)}</section></div>
 }
 if(slide.kind==='crime')return <div className="ds-crime-grid">{[{title:'Jinoyatlar soni',pairs:[['crime25','crime26'],['minor_crime25','minor_crime26']]},{title:'Jinoyat sodir etganlar',pairs:[['offenders25','offenders26'],['minor25','minor26']]}].map(panel=>{
  const maximum=Math.max(1,...panel.pairs.flat().map(id=>index[id]?.value??0))
  return <section className="ds-panel ds-paired" key={panel.title}><h2>{panel.title}</h2><div className="ds-pair-legend">{panel.pairs[0].map((id,i)=><span key={id}><i style={{background:colors[i]}}/>{metricPeriod(index[id].period)}</span>)}</div>{panel.pairs.map((pair,j)=><div className="ds-pair" key={pair[0]}><h3>{j?'Voyaga yetmaganlar':'Yoshlar'}</h3>{pair.map((id,i)=><button key={id} onClick={()=>onInspect([id])}><span className="ds-bar-track"><i style={{width:`${(index[id].value??0)/maximum*100}%`,background:colors[i]}}/></span><strong>{fullNumber(index[id].value)} <small>{index[id].unit}</small></strong></button>)}</div>)}</section>
 })}</div>
 if(canCompare(slide.metrics))return <Comparison metrics={slide.metrics} onInspect={onInspect}/>
 return <div className={`ds-mixed-grid ${slide.metrics.length<=3?'ds-mixed-small':''}`}>{slide.metrics.map((m,i)=><MetricCard key={m.id} metric={m} index={i} onInspect={onInspect}/>)}</div>
})

export function DashboardSlideshow({reports,current,onReportChange,onExplore,onSignOut,onRefresh,error}:{reports:PublishedReport[];current:PublishedReport;onReportChange:(id:string)=>void;onExplore:()=>void;onSignOut:()=>void;onRefresh:()=>void;error:string}) {
 const {report}=current
 const autoTheme=useTvTheme(),[theme,setTheme]=useState<'light'|'dark'|null>(null)
 const [viewport,setViewport]=useState({width:window.innerWidth,height:window.innerHeight})
 const [active,setActive]=useState(0),[paused,setPaused]=useState(()=>document.hidden),[seconds,setSeconds]=useState(20),[elapsed,setElapsed]=useState(0)
 const [menu,setMenu]=useState(false),[query,setQuery]=useState(''),[inspect,setInspect]=useState<string[]|null>(null),[fullscreen,setFullscreen]=useState(!!document.fullscreenElement),[message,setMessage]=useState('')
 const dialog=useRef<HTMLDialogElement>(null),menuDialog=useRef<HTMLDialogElement>(null)
 const slides=useMemo(()=>buildDashboardSlides(report),[report]),index=useMemo(()=>metricIndex(report),[report])
 const position=Math.min(active,slides.length-1),slide=slides[position]
 const scale=Math.min(viewport.width/1920,viewport.height/1080)
 const go=useCallback((next:number)=>{setActive((next+slides.length)%slides.length);setElapsed(0);setPaused(true);setMenu(false)},[slides.length])
 const onInspect=useCallback((ids:string[])=>{setInspect(ids);setPaused(true)},[])
 useEffect(()=>{const resize=()=>setViewport({width:window.innerWidth,height:window.innerHeight});const full=()=>setFullscreen(!!document.fullscreenElement);window.addEventListener('resize',resize);document.addEventListener('fullscreenchange',full);return()=>{window.removeEventListener('resize',resize);document.removeEventListener('fullscreenchange',full)}},[])
 useEffect(()=>{if(paused||menu||inspect||document.hidden)return;let last=performance.now();const timer=setInterval(()=>{const now=performance.now();setElapsed(n=>n+Math.min(1000,now-last));last=now},100);return()=>clearInterval(timer)},[paused,menu,inspect,position])
 useEffect(()=>{if(elapsed<seconds*1000)return;const advance=setTimeout(()=>{setActive(n=>(n+1)%slides.length);setElapsed(0)},0);return()=>clearTimeout(advance)},[elapsed,seconds,slides.length])
 useEffect(()=>{const visibility=()=>{if(document.hidden)setPaused(true)};document.addEventListener('visibilitychange',visibility);return()=>document.removeEventListener('visibilitychange',visibility)},[])
 useEffect(()=>{if(inspect)dialog.current?.showModal();else dialog.current?.close()},[inspect])
 useEffect(()=>{if(menu)menuDialog.current?.showModal();else menuDialog.current?.close()},[menu])
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(inspect||menu||(e.target instanceof HTMLElement&&e.target.closest('input,select,textarea,button')))return;if(e.key==='ArrowRight'){e.preventDefault();go(position+1)}if(e.key==='ArrowLeft'){e.preventDefault();go(position-1)}if(e.code==='Space'){e.preventDefault();setPaused(p=>!p)}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[go,position,menu,inspect])
 const full=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();setMessage('')}catch{setMessage('To‘liq ekran uchun brauzer menyusidan foydalaning.')}}
 return <main className="ds-player" data-theme={theme??autoTheme} aria-label="Rahbar tahliliy slaydlari">
  <div className="ds-canvas" style={{transform:`translate(-50%,-50%) scale(${scale})`}}>
   <header className="ds-header"><div><p>Yoshlar ishlari agentligi <span>Rahbar paneli</span></p><h1>{slide.title}{slide.pages>1&&<small>{slide.page} / {slide.pages}</small>}</h1></div><div className="ds-report-picker"><label>Hisobot sanasi<select aria-label="Hisobot sanasi" value={current.id} onChange={e=>{setPaused(true);setActive(0);setElapsed(0);onReportChange(e.target.value)}}>{reports.map(r=><option key={r.id} value={r.id}>{dateLabel(r.report.asOf)}</option>)}</select></label><button aria-label="Mavzuni almashtirish" onClick={()=>setTheme((theme??autoTheme)==='dark'?'light':'dark')}>{(theme??autoTheme)==='dark'?<Sun/>:<Moon/>}</button></div></header>
   <nav className="ds-chapters" aria-label="Tahlil bo‘limlari">{groups.filter(g=>slides.some(s=>s.group===g.id)).map(g=><button key={g.id} className={slide.group===g.id?'active':''} onClick={()=>go(slides.findIndex(s=>s.group===g.id))}>{g.label}</button>)}</nav>
   {error&&<p className="ds-error" role="alert">{error} Ko‘rsatilayotgan hisobot: {dateLabel(report.asOf)}.</p>}
   <section className="ds-body" key={slide.id}><SlideContent slide={slide} onInspect={onInspect}/></section>
   <footer className="ds-source"><p>{slide.note?<><Info size={22}/>{slide.note}</>:<>Manba: {report.source}{slide.sourceSection&&' · '+slide.sourceSection}</>}</p><button onClick={()=>onInspect(slide.kind==='overview'?['population','youth14','employed_total','unemployed_total','crime26']:slide.metrics.map(m=>m.id))}>Manba va tafsilotlar <ArrowUpRight size={21}/></button></footer>
   <nav className="ds-controls" aria-label="Taqdimot boshqaruvi"><button onClick={()=>{setMenu(true);setPaused(true)}}><LayoutGrid/>Slaydlar <b>{position+1}/{slides.length}</b></button><div><button aria-label="Oldingi slayd" onClick={()=>go(position-1)}><ChevronLeft/></button><button onClick={()=>setPaused(p=>!p)} aria-label={paused?'Davom ettirish':'Pauza'}>{paused?<Play/>:<Pause/>}{paused?'Davom ettirish':'Pauza'}</button><button aria-label="Keyingi slayd" onClick={()=>go(position+1)}><ChevronRight/></button><select aria-label="Slayd davomiyligi" value={seconds} onChange={e=>{setSeconds(Number(e.target.value));setElapsed(0)}}>{[10,15,20,30,45,60].map(s=><option key={s} value={s}>{s} soniya</option>)}</select></div><div><button onClick={onExplore}><Search/>Batafsil tahlil</button><button aria-label="Yangilash" onClick={onRefresh}><RefreshCw/></button><button aria-label={fullscreen?'To‘liq ekrandan chiqish':'To‘liq ekran'} onClick={full}>{fullscreen?<Minimize/>:<Maximize/>}</button><button aria-label="Chiqish" onClick={onSignOut}><LogOut/></button></div></nav>
   {message&&<p className="ds-control-message" role="status">{message}</p>}
   <div className="ds-progress" aria-hidden="true"><i style={{transform:`scaleX(${Math.min(1,elapsed/(seconds*1000))})`}}/></div>
  </div>
  <dialog className="ds-dialog" ref={dialog} onCancel={()=>setInspect(null)}><button className="ds-dialog-close" aria-label="Yopish" onClick={()=>setInspect(null)}><X/></button><p>KO‘RSATKICH TAFSILOTLARI · {dateLabel(report.asOf)}</p>{inspect?.map(id=>{const m=index[id];return m?<section key={id}><h2>{m.label}</h2><strong>{fullNumber(m.value)} <small>{m.unit}</small></strong><p>{m.section} · {metricPeriod(m.period)}</p>{m.value===null&&<p>Manbada qiymat berilmagan.</p>}{m.note&&<p>{m.note}</p>}{m.sectionNote&&<p>{m.sectionNote}</p>}<small>{report.source} · {m.sourceSection}</small></section>:null})}</dialog>
  <dialog className="ds-dialog ds-slide-menu" ref={menuDialog} onCancel={()=>setMenu(false)}><button className="ds-dialog-close" aria-label="Slaydlar ro‘yxatini yopish" onClick={()=>setMenu(false)}><X/></button><h2>Slaydni tanlang</h2><input aria-label="Slayd qidirish" placeholder="Bo‘lim yoki ko‘rsatkich…" value={query} onChange={e=>setQuery(e.target.value)}/><div>{slides.map((s,i)=>({s,i})).filter(({s})=>(s.title+' '+s.metrics.map(m=>m.label).join(' ')).toLowerCase().includes(query.toLowerCase())).map(({s,i})=><button key={s.id} onClick={()=>go(i)}><b>{String(i+1).padStart(2,'0')}</b><span>{s.title}<small>{groups.find(g=>g.id===s.group)?.label}{s.pages>1&&` · ${s.page}/${s.pages}`}</small></span></button>)}</div></dialog>
 </main>
}

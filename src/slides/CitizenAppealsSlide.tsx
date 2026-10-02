import { usePublishedContent } from "@/hooks/usePublishedContent"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { AppealStats } from "./AppealStats"
import { TvFrame } from "./TvFrame"

const number = (value: number) => value.toLocaleString("en-US").replaceAll(",", " ")
function RankingChart({title, items}: {title: string; items: {label: string; value: number}[]}) {
  const max = Math.max(1,...items.map(item=>item.value))
  return <section className="tv-chart-panel"><h2>{title}</h2><div className="tv-bar-list">
    {items.map((item,index)=><div key={index} className="tv-bar-row">
      <span>{item.label}</span><div className="tv-bar-track"><div style={{width:`${item.value/max*100}%`}} /></div><strong>{number(item.value)}</strong>
    </div>)}
  </div></section>
}
export function CitizenAppealsSlide() {
  const content=usePublishedContent("appeals")
  const statuses=[
    {label:"Hal etilgan",value:content.resolved,color:"#10b981"},
    {label:"Jarayonda",value:content.inProgress,color:"#fbbf24"},
    {label:"Muddati o‘tgan",value:content.overdue,color:"#fb7185"},
  ]
  const percent=content.total ? content.resolved/content.total*100 : 0
  return <TvFrame title="Fuqarolar murojaatlari">
    <div className="tv-appeals-stats"><AppealStats {...content}/></div>
    <div className="tv-charts">
      <section className="tv-chart-panel"><h2>Murojaatlar dinamikasi</h2>
        <div className="tv-trend" role="img" aria-label={content.trend.map(item=>`${item.month}: ${number(item.appeals)}`).join(", ")}>
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={content.trend} margin={{top:22,right:30,left:10,bottom:0}}>
            <defs><linearGradient id="tv-trend-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--tv-accent)" stopOpacity={.35}/><stop offset="1" stopColor="var(--tv-accent)" stopOpacity={.02}/></linearGradient></defs>
            <CartesianGrid vertical={false} stroke="var(--tv-border)" strokeDasharray="4 6"/>
            <XAxis dataKey="month" interval={0} tickLine={false} axisLine={false} tick={{fill:"var(--tv-muted)",fontSize:24}} height={40}/>
            <YAxis tickCount={3} width={72} tickLine={false} axisLine={false} tick={{fill:"var(--tv-muted)",fontSize:24}}/>
            <Area dataKey="appeals" type="monotone" stroke="var(--tv-accent)" strokeWidth={4} fill="url(#tv-trend-fill)" dot={{r:5,fill:"var(--tv-accent)"}} isAnimationActive={false}/>
          </AreaChart></ResponsiveContainer>
        </div>
      </section>
      <section className="tv-chart-panel"><h2>Murojaatlar holati</h2><div className="tv-status-chart">
        <div className="tv-donut" role="img" aria-label={`${percent.toFixed(1)}% hal etilgan`}>
          <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statuses} dataKey="value" innerRadius={76} outerRadius={103} strokeWidth={0} startAngle={90} endAngle={-270} isAnimationActive={false}>{statuses.map(item=><Cell key={item.label} fill={item.color}/>)}</Pie></PieChart></ResponsiveContainer>
          <strong>{percent.toFixed(1)}%</strong>
        </div><div className="tv-chart-legend">{statuses.map(item=><p key={item.label}><i style={{background:item.color}}/>{item.label}</p>)}</div>
      </div></section>
      <RankingChart title="Asosiy yo‘nalishlar" items={content.categories.map(item=>({label:item.category,value:item.appeals}))}/>
      <RankingChart title="Yetakchi hududlar" items={content.regions.map(item=>({label:item.region,value:item.appeals}))}/>
    </div>
  </TvFrame>
}

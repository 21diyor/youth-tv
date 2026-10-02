import { CheckCircle2, Clock3, TriangleAlert, Files } from "lucide-react"
const icons = [Files, CheckCircle2, Clock3, TriangleAlert]
const colors = ["blue", "green", "yellow", "red"]
export function AppealStats({ total, resolved, inProgress, overdue, twoColumns = false }: {
  total: number; resolved: number; inProgress: number; overdue: number; twoColumns?: boolean
}) {
  return <div className={`tv-stats ${twoColumns ? "tv-stats-two" : ""}`}>
    {[["Jami murojaatlar", total], ["Hal etilgan", resolved], ["Jarayonda", inProgress], ["Muddati o‘tgan", overdue]].map(([label, value], i) => {
      const Icon = icons[i]
      return <div key={label} className={`tv-stat tv-stat-${colors[i]}`}>
        <div className="tv-stat-label"><p>{label}</p><Icon size={32} aria-hidden="true" /></div>
        <p className="tv-stat-value">{Number(value).toLocaleString("en-US").replaceAll(",", " ")}</p>
      </div>
    })}
  </div>
}

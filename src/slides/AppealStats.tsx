import { CheckCircle2, Clock3, TriangleAlert, Files } from "lucide-react"

const statusStyles = [
  { background: "linear-gradient(125deg, #eff6ff, #bfdbfe)", color: "#1e3a8a" },
  { background: "linear-gradient(125deg, #ecfdf5, #a7f3d0)", color: "#065f46" },
  { background: "linear-gradient(125deg, #fffbeb, #fde68a)", color: "#78350f" },
  { background: "linear-gradient(125deg, #fff1f2, #fecdd3)", color: "#9f1239" },
]
const icons = [Files, CheckCircle2, Clock3, TriangleAlert]
export function AppealStats({ total, resolved, inProgress, overdue }: { total: number; resolved: number; inProgress: number; overdue: number }) {
  return <div className="grid grid-cols-4 gap-4">
    {[["Jami murojaatlar", total], ["Hal etilgan", resolved], ["Jarayonda", inProgress], ["Muddati o‘tgan", overdue]].map(([label, value], i) => {
      const Icon = icons[i]
      return <div key={label} className="rounded-2xl border border-black/5 p-5" style={statusStyles[i]}>
        <div className="flex items-center justify-between gap-2"><p className="text-[16px] font-semibold">{label}</p><Icon size={22} aria-hidden="true" /></div>
        <p className="mt-4 text-[44px] font-semibold leading-none tracking-tight tabular-nums">{Number(value).toLocaleString("en-US").replaceAll(",", " ")}</p>
        <p className="mt-3 text-sm">{i === 0 ? "Barcha murojaatlar" : `${total > 0 ? (Number(value) / total * 100).toFixed(1) : "0"}% jami murojaatlardan`}</p>
      </div>
    })}
  </div>
}

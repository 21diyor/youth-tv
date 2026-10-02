import { usePublishedContent } from "@/hooks/usePublishedContent"
import { AppealStats } from "./AppealStats"
import { TvFrame } from "./TvFrame"

export function CitizenAppealsSlide() {
  const content = usePublishedContent("appeals")
  const groups = [
    { title: "Asosiy yo‘nalishlar", items: content.categories.map(item => ({ label: item.category, value: item.appeals })) },
    { title: "Yetakchi hududlar", items: content.regions.map(item => ({ label: item.region, value: item.appeals })) },
  ]
  return <TvFrame title="Fuqarolar murojaatlari">
    <AppealStats {...content} />
    <div className="tv-analytics">
      {groups.map(group => <section className="tv-panel" key={group.title}>
        <h2>{group.title}</h2>
        <div className="tv-ranking">{group.items.map((item, i) => <div className="tv-ranking-row" key={i}>
          <span>{item.label}</span><strong>{item.value.toLocaleString("en-US").replaceAll(",", " ")}</strong>
        </div>)}</div>
      </section>)}
    </div>
  </TvFrame>
}

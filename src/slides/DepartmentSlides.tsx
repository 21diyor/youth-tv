import { CalendarDays, Clock3, MapPin } from "lucide-react"
import { usePublishedContent } from "@/hooks/usePublishedContent"
import { AppealStats } from "./AppealStats"
import { Portrait } from "./Portrait"
import { PremiumPopper } from "./Celebration"
import { TvFrame } from "./TvFrame"

// Omit the repeated agency name on TV; preserve the saved title.
function shortTitle(title: string) {
  return title.replace(/^O‘zbekiston Respublikasi\s*/i, "").replace(/^Yoshlar ishlari agentligi\s*/i, "")
}
export function ManagementScheduleSlide() {
  const { entries } = usePublishedContent("schedule")
  return <TvFrame title="Rahbariyat qabul jadvali" flag>
    <div className="tv-schedule">
      {entries.map((entry, i) => <article key={i} className="tv-manager-card">
        <Portrait path={entry.photoPath} name={entry.name} className="tv-schedule-portrait" />
        <div className="tv-manager-body">
          <h2>{entry.name}</h2><p className="tv-manager-title">{shortTitle(entry.title)}</p>
          <div className="tv-reception">
            <p><CalendarDays aria-hidden="true" /><strong>{entry.day}</strong></p>
            <p className="tv-reception-time"><Clock3 aria-hidden="true" /><strong>{entry.time}</strong></p>
            <p><MapPin aria-hidden="true" /><span>{entry.location}</span></p>
          </div>
        </div>
      </article>)}
    </div>
  </TvFrame>
}
export function ManagerAppealsSlide({ index }: { index: number }) {
  const content = usePublishedContent("managers").managers[index]
  const schedule = usePublishedContent("schedule")
  if (!content) return null
  return <TvFrame title="Rahbariyat murojaatlari">
    <div className="tv-person-grid">
      <Portrait path={content.photoPath || schedule.entries[index]?.photoPath} name={content.name} className="tv-person-portrait" />
      <div className="tv-person-copy">
        <h2 className="tv-person-name">{content.name}</h2>
        <p className="tv-person-role">{shortTitle(content.title)}</p>
        <AppealStats {...content} twoColumns />
      </div>
    </div>
  </TvFrame>
}
export function BirthdaySlide() {
  const content = usePublishedContent("birthday")
  return <TvFrame title="Bugungi tabrik" celebration>
    <div className="tv-person-grid birthday-card">
      <Portrait path={content.photoPath} name={content.name} className="tv-person-portrait" />
      <div className="tv-person-copy tv-greeting">
        <PremiumPopper />
        <h2>Tug‘ilgan kuningiz muborak!</h2>
        <h3 className="tv-person-name">{content.name}</h3>
        <p className="tv-message">{content.message}</p>
      </div>
    </div>
  </TvFrame>
}

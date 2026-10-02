import { usePublishedContent } from "@/hooks/usePublishedContent"
import { useTashkentDate } from "@/hooks/useTashkentDate"
import { Portrait } from "./Portrait"
import { TvFrame } from "./TvFrame"
export function EmployeeOfMonthSlide() {
  const content = usePublishedContent("employee")
  const calendar = useTashkentDate()
  return <TvFrame title="Oy xodimi">
    <div className="tv-person-grid">
      <Portrait path={content.photoPath} name={content.name} className="tv-person-portrait" />
      <div className="tv-person-copy">
        <p className="tv-eyebrow">{calendar.month} {calendar.year}</p>
        <h2 className="tv-person-name">{content.name}</h2>
        <p className="tv-person-role">{content.position}</p>
        <p className="tv-message tv-recognition">{content.recognition}</p>
      </div>
    </div>
  </TvFrame>
}

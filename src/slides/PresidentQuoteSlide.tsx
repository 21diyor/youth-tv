import { usePublishedContent } from "@/hooks/usePublishedContent"
import { useMediaUrl } from "@/data/media"
import presidentImage from "@/assets/president.jpg"
import { TvFrame } from "./TvFrame"
export function PresidentQuoteSlide() {
  const content = usePublishedContent("president")
  const portrait = useMediaUrl(content.portraitPath)
  const src = portrait.url ?? (portrait.loading ? null : presidentImage)
  return <TvFrame title="Prezident fikri">
    <div className="tv-person-grid tv-quote-grid">
      <div className="tv-person-portrait tv-quote-portrait">{src && <img src={src} alt={content.name} />}</div>
      <div className="tv-person-copy">
        <blockquote className="tv-quote">“{content.quote}”</blockquote>
        <p className="tv-quote-author">{content.name}</p>
        <p className="tv-person-role">{content.position}</p>
        <p className="tv-source">{content.sourceDate}</p>
      </div>
    </div>
  </TvFrame>
}

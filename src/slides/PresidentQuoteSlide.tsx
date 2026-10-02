import { usePublishedContent } from "@/hooks/usePublishedContent"
import { useMediaUrl } from "@/data/media"
import { useTashkentDate } from "@/hooks/useTashkentDate"
import presidentImage from "@/assets/president.jpg"
export function PresidentQuoteSlide() {
  const content = usePublishedContent("president")
  const portrait = useMediaUrl(content.portraitPath)
  const calendar = useTashkentDate()
  const src = portrait.url ?? (portrait.loading ? null : presidentImage)
  return <main className="tv-president">
    <div className="tv-president-photo">{src && <img src={src} alt={content.name}/>}<span>O‘zbekiston</span></div>
    <section className="tv-president-copy">
      <p className="tv-agency">Yoshlar ishlari agentligi</p>
      <div className="tv-president-quote">
        <p className="tv-eyebrow">Prezident fikri</p>
        <blockquote>“{content.quote}”</blockquote>
        <div className="tv-president-attribution"><p>{content.name}</p><span>{content.position}</span><small>{content.sourceDate}</small></div>
      </div>
      <footer>{calendar.date}</footer>
    </section>
  </main>
}

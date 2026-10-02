import type { ReactNode } from "react"
import { useTashkentDate } from "@/hooks/useTashkentDate"
import { UzbekistanFlag } from "./UzbekistanFlag"
import { CornerConfetti } from "./Celebration"

export function TvFrame({ title, children, celebration = false, flag = false }: {
  title: string; children: ReactNode; celebration?: boolean; flag?: boolean
}) {
  const { date } = useTashkentDate()
  return <main className={`tv-frame ${celebration ? "tv-birthday" : ""}`}>
    {flag && <UzbekistanFlag />}
    <header className="tv-header">
      <div><p className="tv-agency">Yoshlar ishlari agentligi</p><h1>{title}</h1></div>
      <p className="tv-date">{date}</p>
    </header>
    <section className="tv-content">{children}</section>
    {celebration && <CornerConfetti />}
  </main>
}

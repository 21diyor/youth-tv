import { useEffect, useState } from "react"

import { useMediaUrl } from "@/data/media"
import { commonData } from "@/data/tvData"

import {
  getEmployeeContent,
  subscribe,
  type EmployeeContent,
} from "@/data/tvStore"

export function EmployeeOfMonthSlide() {
  const [content, setContent] =
    useState<EmployeeContent>(() => getEmployeeContent())

  useEffect(() => {
    return subscribe("employee", () => {
      setContent(getEmployeeContent())
    })
  }, [])

  // Published photo from private storage; placeholder when absent.
  const photo = useMediaUrl(content.photoPath)
  const showPlaceholder = !photo.url && !photo.loading

  return (
    <main className="min-h-screen overflow-hidden bg-[#EEEEEC]">
      <div className="mx-auto aspect-video w-full max-w-[1920px] overflow-hidden bg-[#FAFAF9] text-[#171717]">
        <div className="flex h-full flex-col px-[64px] py-[38px]">

          {/* HEADER */}
          <header className="flex shrink-0 items-start justify-between">
            <div>
              <p className="text-[14px] font-semibold uppercase tracking-[0.19em] text-neutral-500">
                {commonData.agencyName}
              </p>

              <h1 className="mt-[7px] text-[42px] font-semibold leading-none tracking-[-0.045em]">
                Oy xodimi
              </h1>
            </div>

            <div className="pt-[2px] text-right">
              <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
                {content.month}
              </p>

              <p className="mt-[5px] text-[13px] text-neutral-500">
                {content.year} yil
              </p>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <section className="mt-[32px] grid min-h-0 flex-1 grid-cols-[0.82fr_1.18fr] gap-[58px]">

            {/* PHOTO (published) / PLACEHOLDER */}
            <div className="relative min-h-0 overflow-hidden bg-[#E8E8E5]">
              {photo.url && (
                <>
                  <img
                    src={photo.url}
                    alt={content.name}
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />

                  <div className="absolute inset-x-0 bottom-0 h-[120px] bg-gradient-to-t from-black/30 to-transparent" />
                </>
              )}

              {showPlaceholder && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto flex h-[74px] w-[74px] items-center justify-center border border-neutral-300">
                      <span className="text-[28px] font-light text-neutral-400">
                        +
                      </span>
                    </div>

                    <p className="mt-[18px] text-[14px] font-medium text-neutral-500">
                      Xodim rasmi
                    </p>

                    <p className="mt-[5px] text-[12px] text-neutral-400">
                      Portret keyin joylashtiriladi
                    </p>
                  </div>
                </div>
              )}

              <div
                className={`absolute bottom-[28px] left-[30px] right-[30px] border-t pt-[12px] ${
                  photo.url ? "border-white/30" : "border-neutral-300"
                }`}
              >
                <span
                  className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    photo.url ? "text-white" : "text-neutral-500"
                  }`}
                >
                  {commonData.agencyName}
                </span>
              </div>
            </div>

            {/* EMPLOYEE INFORMATION */}
            <div className="flex min-h-0 flex-col justify-center">

              {/* IDENTITY */}
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
                  {content.month} oyi xodimi
                </p>

                <h2 className="mt-[15px] max-w-[760px] text-[58px] font-semibold leading-[0.98] tracking-[-0.055em]">
                  {content.name}
                </h2>

                <p className="mt-[18px] max-w-[650px] text-[18px] font-medium leading-[1.45] text-neutral-500">
                  {content.position} · {content.department}
                </p>
              </div>

              {/* RECOGNITION */}
              <div className="mt-[34px] border-t border-neutral-200 pt-[26px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  E'tirof sababi
                </p>

                <p className="mt-[12px] max-w-[800px] text-[20px] leading-[1.5] tracking-[-0.015em] text-neutral-700">
                  {content.recognition}
                </p>
              </div>

              {/* ACHIEVEMENTS */}
              <div className="mt-[32px] border-t border-neutral-200 pt-[25px]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    Asosiy natijalar
                  </p>

                  <p className="text-[11px] font-medium text-neutral-400">
                    {content.year}
                  </p>
                </div>

                <div className="mt-[10px]">
                  {content.achievements.map(
                    (achievement, index) => (
                      <div
                        key={`${index}-${achievement}`}
                        className="grid grid-cols-[34px_1fr] gap-[12px] border-b border-neutral-200 py-[12px]"
                      >
                        <span className="pt-[2px] text-[11px] font-semibold tabular-nums text-[#1D4ED8]">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <p className="max-w-[760px] text-[14px] font-medium leading-[1.45] text-neutral-600">
                          {achievement}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

            </div>
          </section>

          {/* FOOTER */}
          <footer className="mt-[26px] flex shrink-0 items-center justify-between border-t border-neutral-200 pt-[16px]">
            <p className="text-[11px] font-medium text-neutral-500">
              Fidoyilik · Mas'uliyat · Natija
            </p>

            <p className="text-[11px] tabular-nums text-neutral-400">
              {commonData.displayDate}
            </p>
          </footer>

        </div>
      </div>
    </main>
  )
}
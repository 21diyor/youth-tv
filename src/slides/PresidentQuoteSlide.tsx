import { useEffect, useState } from "react"

import presidentImage from "@/assets/president.jpg"

import { commonData } from "@/data/tvData"

import {
  getPresidentContent,
  subscribe,
  type PresidentContent,
} from "@/data/tvStore"

export function PresidentQuoteSlide() {
  const [content, setContent] =
    useState<PresidentContent>(() => getPresidentContent())

  useEffect(() => {
    return subscribe("president", () => {
      setContent(getPresidentContent())
    })
  }, [])

  return (
    <main className="min-h-screen overflow-hidden bg-[#EEEEEC]">
      <div className="mx-auto aspect-video w-full max-w-[1920px] overflow-hidden bg-[#FAFAF9] text-[#171717]">
        <div className="grid h-full grid-cols-[1.08fr_0.92fr]">

          {/* LEFT — PRESIDENT PHOTO */}
          <section className="relative h-full overflow-hidden bg-[#E7E7E4]">
            <img
              src={presidentImage}
              alt={content.name}
              className="h-full w-full object-cover object-top"
            />

            <div className="absolute inset-x-0 bottom-0 h-[150px] bg-gradient-to-t from-black/30 to-transparent" />

            <div className="absolute bottom-[48px] left-[48px] right-[48px] border-t border-white/30 pt-[14px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.17em] text-white">
                  O‘zbekiston
                </span>

                <span className="text-[11px] font-medium text-white/70">
                  2026
                </span>
              </div>
            </div>
          </section>

          {/* RIGHT — QUOTE */}
          <section className="flex h-full flex-col px-[72px] py-[48px]">
            <header>
              <p className="text-[14px] font-semibold uppercase tracking-[0.19em] text-neutral-500">
                {commonData.agencyName}
              </p>

              <div className="mt-[52px] h-[4px] w-[46px] bg-[#1D4ED8]" />
            </header>

            <div className="flex flex-1 items-center">
              <div className="max-w-[720px]">
                <p className="text-[16px] font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
                  Prezident fikri
                </p>

                <blockquote className="mt-[22px] text-[44px] font-medium leading-[1.17] tracking-[-0.045em]">
                  “{content.quote}”
                </blockquote>

                <div className="mt-[34px] flex items-start gap-[18px]">
                  <div className="mt-[10px] h-px w-[48px] bg-neutral-300" />

                  <div>
                    <p className="text-[16px] font-semibold">
                      {content.name}
                    </p>

                    <p className="mt-[3px] text-[13px] text-neutral-500">
                      {content.position}
                    </p>

                    <p className="mt-[8px] text-[11px] font-medium text-neutral-400">
                      {content.sourceDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <footer className="flex items-end justify-between border-t border-neutral-200 pt-[18px]">
              <p className="text-[12px] font-medium text-neutral-500">
                O‘zbekiston yoshlari uchun
              </p>

              <p className="text-[12px] tabular-nums text-neutral-400">
                {commonData.displayDate}
              </p>
            </footer>
          </section>

        </div>
      </div>
    </main>
  )
}
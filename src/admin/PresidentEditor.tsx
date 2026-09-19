import { useState } from "react"

import presidentImage from "@/assets/president.jpg"

import { uploadPresidentPortrait, useMediaUrl } from "@/data/media"
import {
  getPresidentDraft,
  type PresidentContent,
} from "@/data/tvStore"

import { DraftPublishActions } from "@/admin/DraftPublishActions"
import { ImageUploadControl } from "@/admin/ImageUploadControl"
import { useDraftPublish } from "@/admin/useDraftPublish"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function PresidentEditor() {
  const [initialData] = useState(getPresidentDraft)

  const [name, setName] = useState(initialData.name)
  const [position, setPosition] = useState(initialData.position)
  const [quote, setQuote] = useState(initialData.quote)
  const [sourceDate, setSourceDate] = useState(
    initialData.sourceDate
  )
  // Storage path of the draft portrait (undefined on the local backend).
  const [portraitPath, setPortraitPath] = useState(
    initialData.portraitPath
  )

  const draft: PresidentContent = {
    name,
    position,
    quote,
    sourceDate,
    ...(portraitPath !== undefined ? { portraitPath } : {}),
  }

  const draftPublish = useDraftPublish("president", draft, true)

  const portrait = useMediaUrl(portraitPath)
  // While a stored portrait loads, show nothing rather than the fallback.
  const portraitSrc =
    portrait.url ?? (portrait.loading ? undefined : presidentImage)

  return (
    <div>
      {/* PAGE INTRO */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-neutral-400">
            Kontent boshqaruvi
          </p>

          <h3 className="mt-[5px] text-[32px] font-semibold tracking-[-0.045em]">
            Prezident fikri
          </h3>

          <p className="mt-[8px] max-w-[680px] text-[13px] leading-[1.6] text-neutral-500">
            TV ekranida namoyish etiladigan Prezident iqtibosi,
            manba sanasi va portret ma’lumotlarini boshqarish.
          </p>
        </div>

        <DraftPublishActions state={draftPublish} />
      </div>

      {/* EDITOR */}
      <div className="mt-[34px] grid grid-cols-[1.15fr_0.85fr] gap-[28px]">

        {/* FORM */}
        <section className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-[26px] py-[20px]">
            <h4 className="text-[15px] font-semibold">
              Iqtibos ma’lumotlari
            </h4>

            <p className="mt-[3px] text-[11px] text-neutral-400">
              TV slaydida ko‘rsatiladigan asosiy ma’lumotlar
            </p>
          </div>

          <div className="space-y-[24px] p-[26px]">

            <div className="space-y-[8px]">
              <Label htmlFor="president-name">
                Ism familiya
              </Label>

              <Input
                id="president-name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </div>

            <div className="space-y-[8px]">
              <Label htmlFor="president-position">
                Lavozimi
              </Label>

              <Input
                id="president-position"
                value={position}
                onChange={(event) =>
                  setPosition(event.target.value)
                }
              />
            </div>

            <div className="space-y-[8px]">
              <div className="flex items-center justify-between">
                <Label htmlFor="president-quote">
                  Iqtibos
                </Label>

                <span className="text-[11px] tabular-nums text-neutral-400">
                  {quote.length} belgi
                </span>
              </div>

              <Textarea
                id="president-quote"
                value={quote}
                onChange={(event) =>
                  setQuote(event.target.value)
                }
                className="min-h-[150px] resize-none leading-[1.6]"
              />
            </div>

            <div className="space-y-[8px]">
              <Label htmlFor="source-date">
                Manba sanasi
              </Label>

              <Input
                id="source-date"
                value={sourceDate}
                onChange={(event) =>
                  setSourceDate(event.target.value)
                }
                placeholder="30 iyun 2026"
              />
            </div>

          </div>
        </section>

        {/* PHOTO */}
        <section className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-[26px] py-[20px]">
            <h4 className="text-[15px] font-semibold">
              Portret
            </h4>

            <p className="mt-[3px] text-[11px] text-neutral-400">
              TV slaydida ishlatilayotgan rasm
            </p>
          </div>

          <div className="p-[26px]">
            <div className="overflow-hidden bg-neutral-100">
              <img
                src={portraitSrc}
                alt={name}
                className="aspect-[4/5] w-full object-cover object-top"
              />
            </div>

            <div className="mt-[18px]">
              <p className="text-[13px] font-semibold">
                {name}
              </p>

              <p className="mt-[3px] text-[11px] text-neutral-500">
                {position}
              </p>
            </div>

            <div className="mt-[18px] border-t border-neutral-200 pt-[16px]">
              <ImageUploadControl
                upload={uploadPresidentPortrait}
                onUploaded={setPortraitPath}
                hasPendingImage={draftPublish.isDirty && portraitPath !== initialData.portraitPath}
              />
            </div>
          </div>
        </section>

      </div>

      {/* LIVE PREVIEW */}
      <section className="mt-[28px] border border-neutral-200 bg-white px-[30px] py-[26px]">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-neutral-400">
            Matn ko‘rinishi
          </p>

          <span className="text-[11px] text-neutral-400">
            TV preview
          </span>
        </div>

        <blockquote className="mt-[18px] max-w-[950px] text-[28px] font-medium leading-[1.25] tracking-[-0.035em]">
          “{quote}”
        </blockquote>

        <div className="mt-[22px] flex items-center gap-[14px]">
          <div className="h-px w-[38px] bg-neutral-300" />

          <div>
            <p className="text-[12px] font-semibold">
              {name}
            </p>

            <p className="mt-[2px] text-[11px] text-neutral-400">
              {position} · {sourceDate}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
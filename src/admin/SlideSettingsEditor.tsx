import { useState } from "react"

import {
  getSaveErrorMessage,
  getSlideSettings,
  saveSlideSettings,
} from "@/data/tvStore"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SlideSettingsEditor() {
  const initialSettings = getSlideSettings()

  const [interval, setInterval] = useState(
    String(initialSettings.intervalSeconds)
  )

  const [presidentEnabled, setPresidentEnabled] =
    useState(initialSettings.presidentEnabled)

  const [appealsEnabled, setAppealsEnabled] =
    useState(initialSettings.appealsEnabled)

  const [employeeEnabled, setEmployeeEnabled] =
    useState(initialSettings.employeeEnabled)

  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const enabledCount = [
    presidentEnabled,
    appealsEnabled,
    employeeEnabled,
  ].filter(Boolean).length

  const intervalNumber = Number(interval) || 0

  const intervalValid =
    intervalNumber >= 5 && intervalNumber <= 300

  const canSave =
    enabledCount > 0 && intervalValid

  const handleSave = async () => {
    if (!canSave || saving) {
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      await saveSlideSettings({
        intervalSeconds: intervalNumber,
        presidentEnabled,
        appealsEnabled,
        employeeEnabled,
      })
    } catch (error) {
      setSaveError(getSaveErrorMessage(error))
      return
    } finally {
      setSaving(false)
    }

    setSaved(true)

    window.setTimeout(() => {
      setSaved(false)
    }, 2000)
  }

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-neutral-400">
            Tizim
          </p>

          <h3 className="mt-[5px] text-[32px] font-semibold tracking-[-0.045em]">
            Slayd sozlamalari
          </h3>

          <p className="mt-[8px] max-w-[720px] text-[13px] leading-[1.6] text-neutral-500">
            TV ekranlaridagi slaydlar tartibi va
            avtomatik almashish vaqtini boshqarish.
          </p>
        </div>

        <div className="flex items-center gap-[12px]">
          {saved && (
            <span className="text-[12px] font-medium text-emerald-600">
              Saqlandi
            </span>
          )}

          {saveError && (
            <span className="text-[12px] font-medium text-red-600">
              {saveError}
            </span>
          )}

          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Saqlash
          </Button>
        </div>
      </div>

      {/* INTERVAL */}
      <section className="mt-[34px] border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-[26px] py-[20px]">
          <h4 className="text-[15px] font-semibold">
            Namoyish intervali
          </h4>

          <p className="mt-[3px] text-[11px] text-neutral-400">
            Har bir slayd ekranda qancha vaqt turishini belgilang
          </p>
        </div>

        <div className="p-[26px]">
          <div className="max-w-[360px] space-y-[8px]">
            <Label htmlFor="slide-interval">
              Interval
            </Label>

            <div className="flex items-center gap-[12px]">
              <Input
                id="slide-interval"
                type="number"
                min="5"
                max="300"
                value={interval}
                onChange={(event) =>
                  setInterval(event.target.value)
                }
              />

              <span className="shrink-0 text-[12px] text-neutral-500">
                soniya
              </span>
            </div>

            <p className="text-[10px] text-neutral-400">
              Minimal 5 soniya · Maksimal 300 soniya
            </p>

            {!intervalValid && (
              <p className="text-[11px] font-medium text-red-600">
                Interval 5–300 soniya oralig‘ida bo‘lishi kerak.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* SLIDES */}
      <section className="mt-[28px] border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-[26px] py-[20px]">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[15px] font-semibold">
                Faol slaydlar
              </h4>

              <p className="mt-[3px] text-[11px] text-neutral-400">
                TV ekranida ko‘rsatiladigan slaydlarni tanlang
              </p>
            </div>

            <span className="text-[11px] font-medium text-neutral-400">
              {enabledCount} / 3 faol
            </span>
          </div>
        </div>

        <div>
          <SlideToggle
            number="01"
            title="Prezident fikri"
            description="Prezident iqtibosi va portreti"
            checked={presidentEnabled}
            onChange={setPresidentEnabled}
          />

          <SlideToggle
            number="02"
            title="Fuqarolar murojaatlari"
            description="Statistika va analitik ko‘rsatkichlar"
            checked={appealsEnabled}
            onChange={setAppealsEnabled}
          />

          <SlideToggle
            number="03"
            title="Oy xodimi"
            description="Xodim ma’lumotlari va asosiy natijalar"
            checked={employeeEnabled}
            onChange={setEmployeeEnabled}
          />
        </div>
      </section>

      {enabledCount === 0 && (
        <div className="mt-[18px] border border-red-200 bg-red-50 px-[20px] py-[15px]">
          <p className="text-[12px] font-semibold text-red-700">
            Kamida bitta slayd faol bo‘lishi kerak.
          </p>
        </div>
      )}

      {/* SUMMARY */}
      <section className="mt-[28px] border border-neutral-200 bg-white px-[26px] py-[22px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-neutral-400">
          Joriy konfiguratsiya
        </p>

        <div className="mt-[16px] grid grid-cols-3">
          <div>
            <p className="text-[11px] text-neutral-400">
              Faol slaydlar
            </p>

            <p className="mt-[5px] text-[26px] font-semibold">
              {enabledCount}
            </p>
          </div>

          <div className="border-l border-neutral-200 pl-[26px]">
            <p className="text-[11px] text-neutral-400">
              Interval
            </p>

            <p className="mt-[5px] text-[26px] font-semibold">
              {intervalNumber || 0}
              <span className="ml-[5px] text-[11px] font-normal text-neutral-400">
                soniya
              </span>
            </p>
          </div>

          <div className="border-l border-neutral-200 pl-[26px]">
            <p className="text-[11px] text-neutral-400">
              To‘liq sikl
            </p>

            <p className="mt-[5px] text-[26px] font-semibold">
              {(intervalNumber || 0) * enabledCount}
              <span className="ml-[5px] text-[11px] font-normal text-neutral-400">
                soniya
              </span>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function SlideToggle({
  number,
  title,
  description,
  checked,
  onChange,
}: {
  number: string
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="grid grid-cols-[46px_1fr_auto] items-center border-b border-neutral-200 px-[26px] py-[20px] last:border-b-0">
      <span className="text-[11px] font-semibold text-neutral-400">
        {number}
      </span>

      <div>
        <p className="text-[13px] font-semibold">
          {title}
        </p>

        <p className="mt-[3px] text-[11px] text-neutral-400">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-[24px] w-[44px] rounded-full transition-colors ${
          checked
            ? "bg-[#1D4ED8]"
            : "bg-neutral-300"
        }`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all ${
            checked
              ? "left-[23px]"
              : "left-[3px]"
          }`}
        />
      </button>
    </div>
  )
}
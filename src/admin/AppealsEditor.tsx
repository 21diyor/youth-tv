import { useState } from "react"

import {
  getAppealsContent,
  getSaveErrorMessage,
  saveAppealsContent,
} from "@/data/tvStore"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function formatNumber(value: number) {
  return value.toLocaleString("en-US").replaceAll(",", " ")
}

export function AppealsEditor() {
  const initialData = getAppealsContent()

  const [total, setTotal] = useState(String(initialData.total))
  const [resolved, setResolved] = useState(
    String(initialData.resolved)
  )
  const [inProgress, setInProgress] = useState(
    String(initialData.inProgress)
  )
  const [overdue, setOverdue] = useState(
    String(initialData.overdue)
  )

  const [trend, setTrend] = useState(initialData.trend)
  const [categories, setCategories] = useState(
    initialData.categories
  )
  const [regions, setRegions] = useState(initialData.regions)

  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const totalNumber = Number(total) || 0
  const resolvedNumber = Number(resolved) || 0
  const inProgressNumber = Number(inProgress) || 0
  const overdueNumber = Number(overdue) || 0

  const statusTotal =
    resolvedNumber + inProgressNumber + overdueNumber

  const difference = statusTotal - totalNumber

  const totalsMatch = difference === 0

  const resolvedPercentage =
    totalNumber > 0
      ? (resolvedNumber / totalNumber) * 100
      : 0

  const inProgressPercentage =
    totalNumber > 0
      ? (inProgressNumber / totalNumber) * 100
      : 0

  const overduePercentage =
    totalNumber > 0
      ? (overdueNumber / totalNumber) * 100
      : 0

  const updateTrend = (
    index: number,
    value: string
  ) => {
    setTrend((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              appeals: Number(value),
            }
          : item
      )
    )
  }

  const updateCategoryName = (
    index: number,
    value: string
  ) => {
    setCategories((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              category: value,
            }
          : item
      )
    )
  }

  const updateCategoryValue = (
    index: number,
    value: string
  ) => {
    setCategories((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              appeals: Number(value),
            }
          : item
      )
    )
  }

  const updateRegionName = (
    index: number,
    value: string
  ) => {
    setRegions((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              region: value,
            }
          : item
      )
    )
  }

  const updateRegionValue = (
    index: number,
    value: string
  ) => {
    setRegions((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              appeals: Number(value),
            }
          : item
      )
    )
  }

  const handleSave = async () => {
    if (!totalsMatch || saving) {
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      await saveAppealsContent({
        total: totalNumber,
        resolved: resolvedNumber,
        inProgress: inProgressNumber,
        overdue: overdueNumber,
        trend,
        categories,
        regions,
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
            Analitika
          </p>

          <h3 className="mt-[5px] text-[32px] font-semibold tracking-[-0.045em]">
            Fuqarolar murojaatlari
          </h3>

          <p className="mt-[8px] max-w-[720px] text-[13px] leading-[1.6] text-neutral-500">
            TV ekranidagi murojaatlar statistikasi,
            dinamikasi, yo‘nalishlari va hududiy
            ko‘rsatkichlarni boshqarish.
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
            disabled={!totalsMatch || saving}
            className="bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Saqlash
          </Button>
        </div>
      </div>

      {/* VALIDATION */}
      {!totalsMatch && (
        <div className="mt-[24px] border border-red-200 bg-red-50 px-[20px] py-[16px]">
          <div className="flex items-start justify-between gap-[30px]">
            <div>
              <p className="text-[13px] font-semibold text-red-700">
                Ko‘rsatkichlarda nomuvofiqlik mavjud
              </p>

              <p className="mt-[4px] text-[12px] leading-[1.55] text-red-600">
                Hal etilgan, jarayonda va muddati o‘tgan
                murojaatlar yig‘indisi jami murojaatlar soniga
                teng bo‘lishi kerak.
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[11px] text-red-500">
                Farq
              </p>

              <p className="mt-[3px] text-[20px] font-semibold tabular-nums text-red-700">
                {difference > 0 ? "+" : ""}
                {formatNumber(difference)}
              </p>
            </div>
          </div>

          <div className="mt-[14px] flex items-center gap-[18px] border-t border-red-200 pt-[12px] text-[11px] text-red-600">
            <span>
              Jami:{" "}
              <strong>{formatNumber(totalNumber)}</strong>
            </span>

            <span>
              Ijro holatlari yig‘indisi:{" "}
              <strong>{formatNumber(statusTotal)}</strong>
            </span>
          </div>
        </div>
      )}

      {/* KPI */}
      <section className="mt-[34px] border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-[26px] py-[20px]">
          <h4 className="text-[15px] font-semibold">
            Asosiy ko‘rsatkichlar
          </h4>

          <p className="mt-[3px] text-[11px] text-neutral-400">
            Umumiy murojaatlar va ijro holati
          </p>
        </div>

        <div className="grid grid-cols-4 gap-[18px] p-[26px]">
          <div className="space-y-[8px]">
            <Label htmlFor="total">
              Jami murojaatlar
            </Label>

            <Input
              id="total"
              type="number"
              min="0"
              value={total}
              onChange={(event) =>
                setTotal(event.target.value)
              }
            />
          </div>

          <div className="space-y-[8px]">
            <Label htmlFor="resolved">
              Hal etilgan
            </Label>

            <Input
              id="resolved"
              type="number"
              min="0"
              value={resolved}
              onChange={(event) =>
                setResolved(event.target.value)
              }
            />
          </div>

          <div className="space-y-[8px]">
            <Label htmlFor="in-progress">
              Jarayonda
            </Label>

            <Input
              id="in-progress"
              type="number"
              min="0"
              value={inProgress}
              onChange={(event) =>
                setInProgress(event.target.value)
              }
            />
          </div>

          <div className="space-y-[8px]">
            <Label htmlFor="overdue">
              Muddati o‘tgan
            </Label>

            <Input
              id="overdue"
              type="number"
              min="0"
              value={overdue}
              onChange={(event) =>
                setOverdue(event.target.value)
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-4 border-t border-neutral-200">
          <div className="px-[26px] py-[18px]">
            <p className="text-[11px] text-neutral-400">
              Jami
            </p>

            <p className="mt-[5px] text-[22px] font-semibold tabular-nums">
              {formatNumber(totalNumber)}
            </p>
          </div>

          <div className="border-l border-neutral-200 px-[26px] py-[18px]">
            <p className="text-[11px] text-neutral-400">
              Hal etilgan
            </p>

            <p className="mt-[5px] text-[22px] font-semibold tabular-nums">
              {resolvedPercentage.toFixed(1)}%
            </p>
          </div>

          <div className="border-l border-neutral-200 px-[26px] py-[18px]">
            <p className="text-[11px] text-neutral-400">
              Jarayonda
            </p>

            <p className="mt-[5px] text-[22px] font-semibold tabular-nums">
              {inProgressPercentage.toFixed(1)}%
            </p>
          </div>

          <div className="border-l border-neutral-200 px-[26px] py-[18px]">
            <p className="text-[11px] text-neutral-400">
              Muddati o‘tgan
            </p>

            <p className="mt-[5px] text-[22px] font-semibold tabular-nums">
              {overduePercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </section>

      {/* TREND */}
      <section className="mt-[28px] border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-[26px] py-[20px]">
          <h4 className="text-[15px] font-semibold">
            Murojaatlar dinamikasi
          </h4>

          <p className="mt-[3px] text-[11px] text-neutral-400">
            Oylar kesimidagi murojaatlar soni
          </p>
        </div>

        <div className="grid grid-cols-3 gap-x-[18px] gap-y-[20px] p-[26px]">
          {trend.map((item, index) => (
            <div
              key={item.month}
              className="space-y-[8px]"
            >
              <Label htmlFor={`trend-${index}`}>
                {item.month}
              </Label>

              <Input
                id={`trend-${index}`}
                type="number"
                min="0"
                value={item.appeals}
                onChange={(event) =>
                  updateTrend(
                    index,
                    event.target.value
                  )
                }
              />
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES + REGIONS */}
      <div className="mt-[28px] grid grid-cols-2 gap-[28px]">

        {/* CATEGORIES */}
        <section className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-[26px] py-[20px]">
            <h4 className="text-[15px] font-semibold">
              Murojaat turlari
            </h4>

            <p className="mt-[3px] text-[11px] text-neutral-400">
              TV slaydida ko‘rsatiladigan Top 4 yo‘nalish
            </p>
          </div>

          <div className="space-y-[18px] p-[26px]">
            {categories.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_150px] gap-[14px]"
              >
                <div className="space-y-[7px]">
                  <Label htmlFor={`category-name-${index}`}>
                    Yo‘nalish {index + 1}
                  </Label>

                  <Input
                    id={`category-name-${index}`}
                    value={item.category}
                    onChange={(event) =>
                      updateCategoryName(
                        index,
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="space-y-[7px]">
                  <Label htmlFor={`category-value-${index}`}>
                    Soni
                  </Label>

                  <Input
                    id={`category-value-${index}`}
                    type="number"
                    min="0"
                    value={item.appeals}
                    onChange={(event) =>
                      updateCategoryValue(
                        index,
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* REGIONS */}
        <section className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-[26px] py-[20px]">
            <h4 className="text-[15px] font-semibold">
              Yetakchi hududlar
            </h4>

            <p className="mt-[3px] text-[11px] text-neutral-400">
              TV slaydida ko‘rsatiladigan Top 5 hudud
            </p>
          </div>

          <div className="space-y-[18px] p-[26px]">
            {regions.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_150px] gap-[14px]"
              >
                <div className="space-y-[7px]">
                  <Label htmlFor={`region-name-${index}`}>
                    Hudud {index + 1}
                  </Label>

                  <Input
                    id={`region-name-${index}`}
                    value={item.region}
                    onChange={(event) =>
                      updateRegionName(
                        index,
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="space-y-[7px]">
                  <Label htmlFor={`region-value-${index}`}>
                    Soni
                  </Label>

                  <Input
                    id={`region-value-${index}`}
                    type="number"
                    min="0"
                    value={item.appeals}
                    onChange={(event) =>
                      updateRegionValue(
                        index,
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
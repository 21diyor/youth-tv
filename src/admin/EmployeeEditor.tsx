import { useState } from "react"

import {
  getEmployeeDraft,
  type EmployeeContent,
} from "@/data/tvStore"

import { DraftPublishActions } from "@/admin/DraftPublishActions"
import { useDraftPublish } from "@/admin/useDraftPublish"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function EmployeeEditor() {
  const [initialData] = useState(getEmployeeDraft)

  const [month, setMonth] = useState(initialData.month)
  const [year, setYear] = useState(String(initialData.year))
  const [name, setName] = useState(initialData.name)
  const [position, setPosition] = useState(initialData.position)
  const [department, setDepartment] = useState(
    initialData.department
  )
  const [recognition, setRecognition] = useState(
    initialData.recognition
  )
  const [achievements, setAchievements] = useState(
    initialData.achievements
  )

  const draft: EmployeeContent = {
    month,
    year: Number(year),
    name,
    position,
    department,
    recognition,
    achievements,
  }

  const draftPublish = useDraftPublish("employee", draft, true)

  const updateAchievement = (
    index: number,
    value: string
  ) => {
    setAchievements((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? value : item
      )
    )
  }

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-neutral-400">
            Kontent boshqaruvi
          </p>

          <h3 className="mt-[5px] text-[32px] font-semibold tracking-[-0.045em]">
            Oy xodimi
          </h3>

          <p className="mt-[8px] max-w-[680px] text-[13px] leading-[1.6] text-neutral-500">
            TV ekranida namoyish etiladigan xodim ma’lumotlari,
            e’tirof sababi va asosiy natijalarni boshqarish.
          </p>
        </div>

        <DraftPublishActions state={draftPublish} />
      </div>

      <div className="mt-[34px] grid grid-cols-[1fr_0.78fr] gap-[28px]">

        {/* MAIN DETAILS */}
        <section className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-[26px] py-[20px]">
            <h4 className="text-[15px] font-semibold">
              Xodim ma’lumotlari
            </h4>

            <p className="mt-[3px] text-[11px] text-neutral-400">
              TV slaydida ko‘rsatiladigan asosiy ma’lumotlar
            </p>
          </div>

          <div className="space-y-[22px] p-[26px]">

            <div className="grid grid-cols-2 gap-[18px]">
              <div className="space-y-[8px]">
                <Label htmlFor="employee-month">
                  Oy
                </Label>

                <Input
                  id="employee-month"
                  value={month}
                  onChange={(event) =>
                    setMonth(event.target.value)
                  }
                />
              </div>

              <div className="space-y-[8px]">
                <Label htmlFor="employee-year">
                  Yil
                </Label>

                <Input
                  id="employee-year"
                  type="number"
                  value={year}
                  onChange={(event) =>
                    setYear(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-[8px]">
              <Label htmlFor="employee-name">
                Ism familiya
              </Label>

              <Input
                id="employee-name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </div>

            <div className="space-y-[8px]">
              <Label htmlFor="employee-position">
                Lavozimi
              </Label>

              <Input
                id="employee-position"
                value={position}
                onChange={(event) =>
                  setPosition(event.target.value)
                }
              />
            </div>

            <div className="space-y-[8px]">
              <Label htmlFor="employee-department">
                Bo‘lim
              </Label>

              <Input
                id="employee-department"
                value={department}
                onChange={(event) =>
                  setDepartment(event.target.value)
                }
              />
            </div>

            <div className="space-y-[8px]">
              <Label htmlFor="employee-recognition">
                E’tirof sababi
              </Label>

              <Textarea
                id="employee-recognition"
                value={recognition}
                onChange={(event) =>
                  setRecognition(event.target.value)
                }
                className="min-h-[120px] resize-none leading-[1.6]"
              />
            </div>

          </div>
        </section>

        {/* ACHIEVEMENTS */}
        <section className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-[26px] py-[20px]">
            <h4 className="text-[15px] font-semibold">
              Asosiy natijalar
            </h4>

            <p className="mt-[3px] text-[11px] text-neutral-400">
              Eng muhim uchta natija
            </p>
          </div>

          <div className="space-y-[22px] p-[26px]">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="space-y-[8px]"
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor={`achievement-${index}`}>
                    Natija {index + 1}
                  </Label>

                  <span className="text-[10px] text-neutral-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <Textarea
                  id={`achievement-${index}`}
                  value={achievement}
                  onChange={(event) =>
                    updateAchievement(
                      index,
                      event.target.value
                    )
                  }
                  className="min-h-[92px] resize-none leading-[1.5]"
                />
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* PREVIEW */}
      <section className="mt-[28px] border border-neutral-200 bg-white px-[30px] py-[26px]">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-neutral-400">
            Kontent ko‘rinishi
          </p>

          <span className="text-[11px] text-neutral-400">
            TV preview
          </span>
        </div>

        <p className="mt-[20px] text-[11px] font-semibold uppercase tracking-[0.17em] text-[#1D4ED8]">
          {month} oyi xodimi
        </p>

        <h4 className="mt-[8px] text-[32px] font-semibold tracking-[-0.045em]">
          {name}
        </h4>

        <p className="mt-[6px] text-[13px] text-neutral-500">
          {position} · {department}
        </p>

        <p className="mt-[20px] max-w-[900px] text-[15px] leading-[1.6] text-neutral-700">
          {recognition}
        </p>
      </section>
    </div>
  )
}
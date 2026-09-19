import { useEffect, useState } from "react"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import { commonData } from "@/data/tvData"

import {
  getAppealsContent,
  subscribe,
  type AppealsContent,
} from "@/data/tvStore"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

const BLUE = "#1D4ED8"
const LIGHT_BLUE = "#93C5FD"
const OVERDUE = "#DC2626"

const chartConfig = {
  appeals: {
    label: "Murojaatlar",
    color: BLUE,
  },
} satisfies ChartConfig

function formatNumber(value: number) {
  return value.toLocaleString("en-US").replaceAll(",", " ")
}

export function CitizenAppealsSlide() {
  const [content, setContent] = useState<AppealsContent>(() =>
    getAppealsContent()
  )

  useEffect(() => {
    return subscribe("appeals", () => {
      setContent(getAppealsContent())
    })
  }, [])

  const trendData = content.trend
  const categoryData = content.categories
  const regionData = content.regions

  const total = content.total
  const resolved = content.resolved
  const inProgress = content.inProgress
  const overdue = content.overdue

  const resolvedPercentage =
    total > 0 ? (resolved / total) * 100 : 0

  const inProgressPercentage =
    total > 0 ? (inProgress / total) * 100 : 0

  const overduePercentage =
    total > 0 ? (overdue / total) * 100 : 0

  const latestMonth =
    trendData[trendData.length - 1]?.appeals ?? 0

  const previousMonth =
    trendData[trendData.length - 2]?.appeals ?? latestMonth

  const monthlyChange =
    previousMonth > 0
      ? ((latestMonth - previousMonth) / previousMonth) * 100
      : 0

  const regionMaximum = Math.max(
    ...regionData.map((item) => item.appeals),
    1
  )

  const statusData = [
    {
      status: "Hal etilgan",
      value: resolved,
      fill: BLUE,
    },
    {
      status: "Jarayonda",
      value: inProgress,
      fill: LIGHT_BLUE,
    },
    {
      status: "Muddati o'tgan",
      value: overdue,
      fill: OVERDUE,
    },
  ]

  const stats = [
    {
      label: "Jami murojaatlar",
      value: formatNumber(total),
      detail: "Joriy davr",
    },
    {
      label: "Hal etilgan",
      value: formatNumber(resolved),
      detail: `${resolvedPercentage.toFixed(1)}%`,
    },
    {
      label: "Jarayonda",
      value: formatNumber(inProgress),
      detail: `${inProgressPercentage.toFixed(1)}%`,
    },
    {
      label: "Muddati o'tgan",
      value: formatNumber(overdue),
      detail: `${overduePercentage.toFixed(1)}%`,
    },
  ]

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
                Fuqarolar murojaatlari
              </h1>
            </div>

            <div className="pt-[2px] text-right">
              <p className="text-[16px] font-semibold tabular-nums">
                {commonData.displayDate}
              </p>

              <p className="mt-[5px] text-[13px] text-neutral-500">
                Ma'lumotlar yangilangan
              </p>
            </div>
          </header>

          {/* KPI STRIP */}
          <section className="mt-[22px] shrink-0 border-y border-neutral-200">
            <div className="grid grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`py-[17px] ${
                    index !== 0
                      ? "border-l border-neutral-200 pl-[30px]"
                      : ""
                  }`}
                >
                  <p className="text-[14px] font-medium text-neutral-500">
                    {stat.label}
                  </p>

                  <div className="mt-[6px] flex items-end gap-[12px]">
                    <p className="text-[39px] font-semibold leading-none tracking-[-0.045em] tabular-nums">
                      {stat.value}
                    </p>

                    {index !== 0 && (
                      <span className="mb-[3px] text-[13px] font-medium text-neutral-400">
                        {stat.detail}
                      </span>
                    )}
                  </div>

                  {index === 0 && (
                    <p className="mt-[6px] text-[12px] font-medium text-neutral-400">
                      {stat.detail}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ANALYTICS */}
          <section className="mt-[22px] grid min-h-0 flex-1 grid-cols-[1.7fr_0.78fr] gap-[34px]">

            {/* LEFT */}
            <div className="grid min-h-0 grid-rows-[1.13fr_0.87fr]">

              {/* TREND */}
              <section className="min-h-0 border-b border-neutral-200 pb-[15px]">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-neutral-500">
                      Dinamika
                    </p>

                    <h2 className="mt-[4px] text-[22px] font-semibold tracking-[-0.03em]">
                      Murojaatlar dinamikasi
                    </h2>
                  </div>

                  <div className="flex items-center gap-[18px] pb-[2px]">
                    <div className="flex items-baseline gap-[6px]">
                      <span
                        className={`text-[16px] font-semibold ${
                          monthlyChange < 0
                            ? "text-[#DC2626]"
                            : "text-[#1D4ED8]"
                        }`}
                      >
                        {monthlyChange >= 0 ? "+" : ""}
                        {monthlyChange.toFixed(1)}%
                      </span>

                      <span className="text-[11px] text-neutral-500">
                        o'tgan oyga nisbatan
                      </span>
                    </div>

                    <span className="h-[14px] w-px bg-neutral-200" />

                    <span className="text-[12px] font-medium text-neutral-500">
                      2026 yil · oylar kesimida
                    </span>
                  </div>
                </div>

                <ChartContainer
                  config={chartConfig}
                  className="mt-[6px] h-[245px] w-full"
                >
                  <AreaChart
                    accessibilityLayer
                    data={trendData}
                    margin={{
                      left: 12,
                      right: 12,
                      top: 10,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="appealsGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={BLUE}
                          stopOpacity={0.2}
                        />

                        <stop
                          offset="100%"
                          stopColor={BLUE}
                          stopOpacity={0.015}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      vertical={false}
                      stroke="#ECECEA"
                      strokeDasharray="3 4"
                    />

                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      fontSize={12}
                      tick={{ fill: "#737373" }}
                      interval={0}
                    />

                    <ChartTooltip
                      cursor={{
                        stroke: "#D4D4D4",
                        strokeDasharray: "4 4",
                      }}
                      content={<ChartTooltipContent />}
                    />

                    <Area
                      dataKey="appeals"
                      type="monotone"
                      fill="url(#appealsGradient)"
                      stroke={BLUE}
                      strokeWidth={3}
                      isAnimationActive
                      animationDuration={1300}
                    />
                  </AreaChart>
                </ChartContainer>
              </section>

              {/* CATEGORIES */}
              <section className="min-h-0 pt-[15px]">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-neutral-500">
                      Tarkib
                    </p>

                    <h2 className="mt-[4px] text-[22px] font-semibold tracking-[-0.03em]">
                      Murojaat turlari
                    </h2>
                  </div>

                  <p className="pb-[2px] text-[12px] font-medium text-neutral-500">
                    Top 4 yo'nalish
                  </p>
                </div>

                <ChartContainer
                  config={chartConfig}
                  className="mt-[5px] h-[185px] w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={categoryData}
                    layout="vertical"
                    margin={{
                      left: 5,
                      right: 80,
                      top: 3,
                      bottom: 3,
                    }}
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke="#EEEEEC"
                      strokeDasharray="3 4"
                    />

                    <YAxis
                      dataKey="category"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={135}
                      tickMargin={12}
                      fontSize={13}
                      tick={{ fill: "#525252" }}
                    />

                    <XAxis
                      dataKey="appeals"
                      type="number"
                      hide
                    />

                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />

                    <Bar
                      dataKey="appeals"
                      fill={BLUE}
                      radius={[0, 3, 3, 0]}
                      barSize={18}
                      isAnimationActive
                      animationDuration={1000}
                    >
                      <LabelList
                        dataKey="appeals"
                        position="right"
                        offset={12}
                        formatter={(value: unknown) =>
                          formatNumber(Number(value))
                        }
                        style={{
                          fill: "#171717",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </section>
            </div>

            {/* RIGHT */}
            <div className="grid min-h-0 grid-rows-[0.93fr_1.07fr] border-l border-neutral-200 pl-[34px]">

              {/* STATUS */}
              <section className="min-h-0 border-b border-neutral-200 pb-[16px]">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-neutral-500">
                    Ijro
                  </p>

                  <h2 className="mt-[4px] text-[22px] font-semibold tracking-[-0.03em]">
                    Murojaatlar holati
                  </h2>
                </div>

                <div className="mt-[6px] grid grid-cols-[205px_1fr] items-center gap-[22px]">
                  <div className="relative h-[205px] w-[205px]">
                    <ChartContainer
                      config={chartConfig}
                      className="h-full w-full"
                    >
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="status"
                          innerRadius={70}
                          outerRadius={94}
                          strokeWidth={0}
                          paddingAngle={2}
                          startAngle={90}
                          endAngle={-270}
                          isAnimationActive
                          animationDuration={1200}
                        >
                          {statusData.map((item) => (
                            <Cell
                              key={item.status}
                              fill={item.fill}
                            />
                          ))}
                        </Pie>

                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent />}
                        />
                      </PieChart>
                    </ChartContainer>

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[32px] font-semibold leading-none tracking-[-0.05em]">
                        {resolvedPercentage.toFixed(1)}%
                      </span>

                      <span className="mt-[7px] text-[11px] font-medium text-neutral-500">
                        hal etilgan
                      </span>
                    </div>
                  </div>

                  <div className="space-y-[18px]">
                    {statusData.map((item) => (
                      <div
                        key={item.status}
                        className="grid grid-cols-[1fr_auto] items-center gap-[18px]"
                      >
                        <div className="flex items-center gap-[10px]">
                          <span
                            className="h-[8px] w-[8px] shrink-0 rounded-full"
                            style={{
                              backgroundColor: item.fill,
                            }}
                          />

                          <span className="whitespace-nowrap text-[13px] font-medium text-neutral-600">
                            {item.status}
                          </span>
                        </div>

                        <span className="text-[14px] font-semibold tabular-nums">
                          {formatNumber(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* REGIONS */}
              <section className="min-h-0 pt-[15px]">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-neutral-500">
                      Hududlar
                    </p>

                    <h2 className="mt-[4px] text-[22px] font-semibold tracking-[-0.03em]">
                      Yetakchi hududlar
                    </h2>
                  </div>

                  <span className="pb-[2px] text-[11px] font-medium text-neutral-500">
                    Top 5
                  </span>
                </div>

                <div className="mt-[10px]">
                  {regionData.map((item, index) => {
                    const percentage =
                      (item.appeals / regionMaximum) * 100

                    return (
                      <div
                        key={`${index}-${item.region}`}
                        className="grid grid-cols-[28px_1fr_62px] items-center gap-[11px] border-t border-neutral-200 py-[9px]"
                      >
                        <span className="text-[11px] font-medium tabular-nums text-neutral-400">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <div>
                          <div className="text-[13px] font-medium leading-none">
                            {item.region}
                          </div>

                          <div className="mt-[7px] h-[4px] w-full bg-neutral-100">
                            <div
                              className="h-full bg-[#1D4ED8]"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>

                        <span className="text-right text-[13px] font-semibold tabular-nums">
                          {formatNumber(item.appeals)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
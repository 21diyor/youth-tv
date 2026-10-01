const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"]
// Some TV browsers omit Uzbek locale data. Numeric parts + our month names
// avoid displaying ICU fallback strings such as "M10".
function partsAtTashkent(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", day: "numeric", month: "numeric", year: "numeric" }).formatToParts(now)
  const part = (type: string) => Number(parts.find(p => p.type === type)!.value)
  return { day: part("day"), month: months[part("month") - 1], year: part("year") }
}
export function tashkentDate(now = new Date()) {
  const { day, month, year } = partsAtTashkent(now)
  return `${day} ${month} ${year}`
}
export function tashkentPeriod(now = new Date()) {
  const { month, year } = partsAtTashkent(now)
  return { month, year }
}

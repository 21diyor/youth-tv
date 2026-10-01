import type { BirthdayContent, ManagersContent, ScheduleContent } from './tvTypes'

export const scheduleDefaults: ScheduleContent = { enabled: false, entries: Array.from({ length: 4 }, () => ({ name: '', title: '', day: '', time: '', location: '' })) }
export const managersDefaults: ManagersContent = { managers: Array.from({ length: 4 }, () => ({ enabled: false, name: '', title: '', total: 0, resolved: 0, inProgress: 0, overdue: 0 })) }
export const birthdayDefaults: BirthdayContent = { enabled: false, name: '', department: '', message: 'Tug‘ilgan kuningiz muborak! Sizga mustahkam sog‘liq, baxt va ulkan muvaffaqiyatlar tilaymiz!', photoPath: null }

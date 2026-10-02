import test from 'node:test'
import assert from 'node:assert/strict'
import { tashkentDate, tashkentPeriod, tashkentTheme } from '../src/lib/tashkentTime.ts'

test('date rolls over at Tashkent midnight, not the device timezone', () => {
  assert.equal(tashkentDate(new Date('2026-10-01T18:59:59Z')), '1 oktabr 2026')
  assert.equal(tashkentDate(new Date('2026-10-01T19:00:00Z')), '2 oktabr 2026')
})
test('month and year roll over together', () => {
  assert.deepEqual(tashkentPeriod(new Date('2026-12-31T19:00:00Z')), { month: 'yanvar', year: 2027 })
  assert.equal(tashkentDate(new Date('2028-02-28T19:00:00Z')), '29 fevral 2028')
})

test('TV theme switches at 06:00 and 18:30 Tashkent time', () => {
  for (const [utc, expected] of [
    ['2026-10-02T00:59:59Z', 'dark'],
    ['2026-10-02T01:00:00Z', 'light'],
    ['2026-10-02T13:29:59Z', 'light'],
    ['2026-10-02T13:30:00Z', 'dark'],
    ['2026-10-02T19:00:00Z', 'dark'],
    ['2026-12-31T19:00:00Z', 'dark'],
  ]) assert.equal(tashkentTheme(new Date(utc)), expected, utc)
})

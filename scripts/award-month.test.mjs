import test from 'node:test'
import assert from 'node:assert/strict'
import {previousMonthKey,awardMonthLabel} from '../src/lib/awardMonth.ts'
test('completed month, year rollover and Uzbek award labels',()=>{
 assert.equal(previousMonthKey('2026-10'),'2026-09')
 assert.equal(previousMonthKey('2027-01'),'2026-12')
 assert.equal(awardMonthLabel('2026-09'),'Sentabr 2026')
 assert.equal(awardMonthLabel('2026-12'),'Dekabr 2026')
})

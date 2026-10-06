import test from 'node:test'
import assert from 'node:assert/strict'
import { percentage, dateLabel, compact, metricIndex } from '../src/dashboard/model.ts'

test('missing and zero denominators do not manufacture percentages', () => {
  assert.equal(percentage(null, 10), null)
  assert.equal(percentage(5, 0), null)
  assert.equal(percentage(0, 10), 0)
  assert.equal(percentage(2, 3), 66.7)
  assert.equal(percentage(12, 10), 120)
  assert.equal(compact(null), '—')
  assert.equal(compact(0), '0')
})

test('report dates do not shift with the viewing device timezone', () => {
  assert.equal(dateLabel('2026-06-01'), '1 iyun 2026')
  assert.equal(dateLabel('2028-02-29'), '29 fevral 2028')
})

test('drilldown preserves source, scope, missing values and exact precision', () => {
  const report = { sections: [{title:'Section', sourceSection:'II.1', note:'Scopes overlap', metrics:[{id:'example',label:'Example',value:12.345,unit:'ha',period:'2026-06-01',note:''},{id:'missing',value:null}]}] }
  const index = metricIndex(report)
  assert.equal(index.example.value,12.345)
  assert.equal(index.example.sourceSection,'II.1')
  assert.equal(index.example.sectionNote,'Scopes overlap')
  assert.equal(index.missing.value,null)
})

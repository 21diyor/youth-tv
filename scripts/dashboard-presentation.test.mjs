import test from 'node:test'
import assert from 'node:assert/strict'
import {buildDashboardSlides,canCompare,metricPeriod} from '../src/dashboard/presentationModel.ts'

const metric=(id,value=10,unit='nafar',period='2026-06-01')=>({id,label:id,value,unit,period,note:''})
const section=(id,metrics)=>({id,title:id,group:'overview',sourceSection:'I',note:'Source caveat',metrics})
const report=sections=>({title:'Fixture',asOf:'2026-06-01',source:'Fixture',sections})

test('pagination preserves every metric and its source caveats, including null and zero',()=>{
 const metrics=Array.from({length:19},(_,i)=>metric(`metric-${i}`,i===0?null:i))
 const slides=buildDashboardSlides(report([section('general',metrics)]))
 assert.equal(slides.length,5)
 assert.deepEqual(slides.slice(1).flatMap(s=>s.metrics),metrics)
 assert.ok(slides.slice(1).every(s=>s.metrics.length<=6&&s.note==='Source caveat'&&s.sourceSection==='I'))
 assert.deepEqual(slides.slice(1).map(s=>[s.page,s.pages]),[[1,4],[2,4],[3,4],[4,4]])
})
test('special charts retain known categories and future additions remain visible',()=>{
 const balance=['green','yellow','red'].map(id=>metric(id))
 assert.equal(buildDashboardSlides(report([section('balance',balance)]))[1].kind,'balance')
 const extended=[...balance,metric('new-category')]
 const slides=buildDashboardSlides(report([section('balance',extended)]))
 assert.equal(slides[1].kind,'metrics')
 assert.deepEqual(slides[1].metrics,extended)
})
test('comparisons never mix units or reporting periods; missing is distinct from zero',()=>{
 assert.equal(canCompare([metric('a',null),metric('b',0)]),true)
 assert.equal(canCompare([metric('a'),metric('b',10,'ta')]),false)
 assert.equal(canCompare([metric('a'),metric('b',10,'nafar','2025')]),false)
 assert.equal(canCompare([metric('a'),metric('b',-1)]),false)
 assert.equal(canCompare([]),false)
 assert.equal(metricPeriod('2026-01/2026-05'),'2026 · yanvar–may')
})

test('admin layout, order, visibility, duration and overview settings drive playback',()=>{
 const r=report([section('a',Array.from({length:7},(_,i)=>metric(`a-${i}`))),section('b',[metric('b')])])
 r.presentation={showOverview:false,duration:30}
 r.sections[0]={...r.sections[0],chart:'cards',pageSize:3,duration:45}
 r.sections[1].visible=false
 const slides=buildDashboardSlides(r)
 assert.equal(slides.length,3)
 assert.deepEqual(slides.map(s=>s.metrics.length),[3,3,1])
 assert.ok(slides.every(s=>s.chart==='cards'&&s.duration===45))
 r.sections[0].visible=false
 assert.deepEqual(buildDashboardSlides(r),[])
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {timelinePosition,clockAnchor} from '../src/lib/playbackTimeline.ts'

const slides=[{id:'appeals',durationMs:10000},{id:'schedule',durationMs:30000},{id:'birthday',durationMs:15000}]
test('different durations have exact shared boundaries with no transition drift',()=>{
 assert.equal(timelinePosition(slides,9999).id,'appeals')
 assert.equal(timelinePosition(slides,10000).id,'schedule')
 assert.equal(timelinePosition(slides,39999).id,'schedule')
 assert.equal(timelinePosition(slides,40000).id,'birthday')
 assert.deepEqual(timelinePosition(slides,55000),{index:0,id:'appeals',elapsed:0,duration:10000,cycle:1})
 assert.equal(timelinePosition(slides,55000*100000+11000).elapsed,1000)
})
test('three TVs opened at different times join the same point despite different device clocks',()=>{
 const now=1780000000000
 const devices=[{server:now-100000,perf:100},{server:now-20000,perf:50000},{server:now-500,perf:2000}]
 const positions=devices.map(d=>{
  const anchor=clockAnchor(d.server,d.perf-40,d.perf)
  return timelinePosition(slides,anchor.serverNow+(now-d.server-20))
 })
 assert.deepEqual(positions[0],positions[1]);assert.deepEqual(positions[1],positions[2])
})
test('late wakes and playlist changes recalculate directly; empty playlists are safe',()=>{
 assert.equal(timelinePosition([],Date.now()),null)
 assert.equal(timelinePosition([{id:'only',durationMs:5000}],12345).elapsed,2345)
 assert.equal(timelinePosition(slides.slice(1),40000).id,'birthday')
 assert.equal(timelinePosition(slides,10000).id,'schedule')
 assert.equal(timelinePosition(slides,10000+55*1000*20).id,'schedule')
})

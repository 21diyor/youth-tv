export type TimedSlide = { id: string; durationMs: number }

// A shared epoch, not the time a browser was opened. No cumulative timers or
// transition delays: every frame is derived from the same absolute clock.
export function timelinePosition(slides: TimedSlide[], now: number) {
 const total=slides.reduce((sum,s)=>sum+s.durationMs,0)
 if(!slides.length||total<=0)return null
 const cycle=Math.floor(now/total)
 let elapsed=((now%total)+total)%total
 for(let index=0;index<slides.length;index++) {
  const slide=slides[index]
  if(elapsed<slide.durationMs)return {index,id:slide.id,elapsed,duration:slide.durationMs,cycle}
  elapsed-=slide.durationMs
 }
 return null
}

export function clockAnchor(serverNow:number,sent:number,received:number) {
 // The RPC stamps time just before returning; half the round trip estimates
 // the remaining network transit. performance.now avoids TV clock settings.
 return {serverNow:serverNow+(received-sent)/2,measuredAt:received}
}

// React wakes only for the exit transition and the next shared slide boundary.
export function nextPlaybackWake(duration:number,elapsed:number,transition:number) {
 const remaining=duration-elapsed
 return Math.max(1,Math.ceil(remaining>transition?remaining-transition:remaining))
}

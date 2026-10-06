import {useEffect,useState} from 'react'
import {getSupabase} from '@/lib/supabase'
import {clockAnchor,type TimedSlide} from '@/lib/playbackTimeline'
import type {CurrentHrSlides} from '@/data/hrPlans'

export type PlaybackState={slides:TimedSlide[];hr:CurrentHrSlides;serverNow:number;measuredAt:number}
export function usePlaybackState() {
 const [state,setState]=useState<PlaybackState|null>(null)
 const [offline,setOffline]=useState(false)
 useEffect(()=>{
  let cancelled=false,busy=false
  const refresh=async()=>{
   if(busy)return
   busy=true
   const sent=performance.now()
   try {
    const {data,error}=await getSupabase().rpc('tv_playback_state')
    if(cancelled)return
    if(error||!data)throw error
    const result=data as unknown as {slides:TimedSlide[];hr:CurrentHrSlides;serverNow:number}
    const received=performance.now()
    setState({...result,...clockAnchor(result.serverNow,sent,received)})
    setOffline(false)
   }catch{if(!cancelled)setOffline(true)}finally{busy=false}
  }
  void refresh()
  const timer=window.setInterval(refresh,10000)
  window.addEventListener('online',refresh)
  window.addEventListener('pageshow',refresh)
  document.addEventListener('visibilitychange',refresh)
  return()=>{cancelled=true;clearInterval(timer);window.removeEventListener('online',refresh);window.removeEventListener('pageshow',refresh);document.removeEventListener('visibilitychange',refresh)}
 },[])
 return {state,offline}
}

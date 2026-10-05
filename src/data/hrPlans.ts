import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase"
import { useTashkentDate } from "@/hooks/useTashkentDate"
import type { Json } from "@/types/database"

export type HrPayload = {
  staffId?: string; enabled: boolean; name: string; department: string; position: string;
  message: string; recognition: string; photoPath: string | null; dateKey: string
}
export type HrPlan = { id: string; kind: "birthday" | "employee"; draft: HrPayload; published: HrPayload | null; published_at: string | null }
export type HrSlide = Omit<HrPayload, "dateKey"> & {id: string}
export type CurrentHrSlides = {date: string; birthdays: HrSlide[]; employee: HrSlide | null}
export function emptyHrPayload(): HrPayload {
  return {enabled:true,name:"",department:"",position:"",message:"Tug‘ilgan kuningiz muborak! Sizga sog‘liq, baxt va muvaffaqiyat tilaymiz!",recognition:"",photoPath:null,dateKey:""}
}
export async function loadHrPlans(kind: HrPlan["kind"]) {
  const {data,error}=await getSupabase().from("hr_plans").select("*").eq("kind",kind).order("updated_at",{ascending:false})
  if(error) throw error
  return data as unknown as HrPlan[]
}
export async function saveHrPlan(id: string | null, kind: HrPlan["kind"], draft: HrPayload) {
  const client=getSupabase()
  const result=id
    ? await client.from("hr_plans").update({draft:draft as unknown as Json}).eq("id",id).select().single()
    : await client.from("hr_plans").insert({kind,draft:draft as unknown as Json}).select().single()
  if(result.error)throw result.error
  return result.data as unknown as HrPlan
}
export async function publishHrPlan(id: string) {
  const {data,error}=await getSupabase().rpc("publish_hr_plan",{plan_id:id})
  if(error)throw error
  window.dispatchEvent(new Event("hr-plan-published"))
  return data as unknown as HrPlan
}
export function useCurrentHrSlides() {
  const {date}=useTashkentDate()
  const [state,setState]=useState<{day:string;value:CurrentHrSlides} | null>(null)
  useEffect(()=>{
    let cancelled=false, busy=false
    const refresh=async()=>{
      if(busy)return
      busy=true
      try {
        const {data,error}=await getSupabase().rpc("current_hr_slides")
        if(!cancelled && !error && data) setState({day:date,value:data as unknown as CurrentHrSlides})
      } catch { /* Keep today's last successful result during a network interruption. */ }
      finally {busy=false}
    }
    void refresh()
    const timer=window.setInterval(refresh,30000)
    window.addEventListener("online",refresh)
    window.addEventListener("pageshow",refresh)
    window.addEventListener("hr-plan-published",refresh)
    document.addEventListener("visibilitychange",refresh)
    return ()=>{
      cancelled=true;window.clearInterval(timer)
      window.removeEventListener("online",refresh)
      window.removeEventListener("pageshow",refresh)
      window.removeEventListener("hr-plan-published",refresh)
      document.removeEventListener("visibilitychange",refresh)
    }
  },[date])
  return state?.day===date ? state.value : null
}

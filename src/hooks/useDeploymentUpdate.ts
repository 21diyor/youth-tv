import {useEffect} from 'react'
declare const __TV_RELEASE__: string

// TV only: admin drafts must never be discarded by an automatic reload.
export function useDeploymentUpdate() {
 useEffect(()=>{
  if(import.meta.env.DEV)return
  let busy=false,cancelled=false,lastReload=0
  const check=async()=>{
   if(busy)return
   busy=true
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000)
   try {
    const response=await fetch('/version.json?t='+Date.now(),{cache:'no-store',signal:controller.signal})
    if(!response.ok)return
    const data=await response.json()
    if(!cancelled&&typeof data.version==='string'&&data.version!==__TV_RELEASE__){
     // Prevent stale CDN responses from causing a reload loop.
     try{lastReload=Number(sessionStorage.getItem('tv-last-upgrade')||lastReload)}catch{/* Some TV browsers disable storage. */}
     if(Date.now()-lastReload>120000){lastReload=Date.now();try{sessionStorage.setItem('tv-last-upgrade',String(lastReload))}catch{/* Reload still works without storage. */}window.location.reload()}
    }
   }catch{/* Retry after network recovery. */}finally{clearTimeout(timeout);busy=false}
  }
  void check()
  const timer=setInterval(check,30000)
  window.addEventListener('online',check);document.addEventListener('visibilitychange',check)
  return()=>{cancelled=true;clearInterval(timer);window.removeEventListener('online',check);document.removeEventListener('visibilitychange',check)}
 },[])
}

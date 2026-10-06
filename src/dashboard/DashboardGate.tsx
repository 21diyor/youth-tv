import { useState,useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useAuth } from '@/auth/authContext'
import { DashboardPage } from './DashboardPage'
import './dashboard.css'

export function DashboardGate(){
 const auth=useAuth()
 const userId=auth.user?.id
 const [checked,setChecked]=useState<{id:string;allowed:boolean}|null>(null)
 const [error,setError]=useState('')
 const [username,setUsername]=useState('')
 const [password,setPassword]=useState('')
 const [busy,setBusy]=useState(false)
 const [retry,setRetry]=useState(0)
 useEffect(()=>{
  let cancelled=false
  if(!userId)return
  const id=userId
  getSupabase().rpc('is_dashboard_owner').then(({data,error})=>{
   if(cancelled)return
   if(error)setError('Ruxsatni tekshirib bo‘lmadi. Qayta urinib ko‘ring.')
   else {setError('');setChecked({id,allowed:data===true})}
  })
  return()=>{cancelled=true}
 },[userId,retry])
 if(auth.loading)return <main className="bi-loading" role="status">Yuklanmoqda…</main>
 if(auth.configError)return <main className="bi-loading" role="alert">{auth.configError}</main>
 if(auth.user){
  if(error)return <main className="bi-loading"><p role="alert">{error}</p><button onClick={()=>setRetry(r=>r+1)}>Qayta urinish</button><button onClick={auth.signOut}>Chiqish</button></main>
  if(checked?.id!==auth.user.id)return <main className="bi-loading">Ruxsat tekshirilmoqda…</main>
  if(!checked.allowed)return <main className="bi-loading"><h1>Bu sahifa uchun ruxsat yo‘q</h1><p>Rahbarning alohida hisobi bilan kiring.</p><button onClick={auth.signOut}>Boshqa hisob bilan kirish</button></main>
  return <DashboardPage key={auth.user.id}/>
 }
 return <main className="bi-login"><section className="bi-login-brand"><div className="bi-mark">Y</div><span>YOSHLAR ISHLARI AGENTLIGI</span><h1>Respublika yoshlar<br/>siyosati.</h1><p>Respublika yoshlar siyosati bo‘yicha rahbarning tahliliy paneli.</p><div className="bi-login-art"><i/><i/><i/><i/><i/><i/><i/></div></section><section className="bi-login-form"><div><small>RAHBAR UCHUN</small><h2>Tahliliy panelga kirish</h2><p>Alohida login va parolingizni kiriting.</p><form onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');try{const result=await auth.signIn(username,password);if(result)setError(result)}catch{setError('Serverga ulanib bo‘lmadi.')}finally{setBusy(false)}}}><label>Login<input autoComplete="username" autoCapitalize="none" required value={username} onChange={e=>setUsername(e.target.value)}/></label><label>Parol<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert" className="bi-error">{error}</p>}<button disabled={busy} type="submit">{busy?'Kirilmoqda…':'Kirish →'}</button></form></div></section></main>
}


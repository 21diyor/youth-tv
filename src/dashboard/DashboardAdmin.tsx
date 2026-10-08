import {useEffect,useState} from 'react'
import {useAuth} from '@/auth/authContext'
import {loginDisplayName} from '@/auth/loginIdentifier'
import {getSupabase} from '@/lib/supabase'
import {LoginPage} from '@/auth/LoginPage'
import {GateMessage} from '@/auth/GateMessage'
import {DashboardEditor} from './DashboardEditor'
import './editor.css'

export function DashboardAdmin(){
 const auth=useAuth(),userId=auth.user?.id
 const [check,setCheck]=useState<{id:string;allowed:boolean}|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0)
 useEffect(()=>{if(!userId)return;let cancelled=false;getSupabase().rpc('is_dashboard_editor').then(({data,error})=>{if(cancelled)return;if(error)setError('Ruxsatni tekshirib bo‘lmadi.');else{setError('');setCheck({id:userId,allowed:data===true})}});return()=>{cancelled=true}},[userId,retry])
 if(auth.configError)return <GateMessage title={auth.configError}/>
 if(auth.loading)return <p className="de-loading">Yuklanmoqda…</p>
 if(!auth.session)return <LoginPage dashboardAdmin/>
 if(error)return <GateMessage title={error} onRetry={()=>setRetry(n=>n+1)} onSignOut={auth.signOut}/>
 if(check?.id!==userId)return <p className="de-loading">Ruxsat tekshirilmoqda…</p>
 if(!check?.allowed)return <GateMessage title="Dashboard boshqaruvi uchun ruxsat yo‘q" onSignOut={auth.signOut}/>
 return <main className="de-app"><header className="de-app-header"><a href="/dashboard-admin">Y <span>Rahbar paneli <small>BOSHQARUV</small></span></a><div>{auth.hasRole('super_admin')&&<a href="/admin">TV boshqaruvi</a>}<span>{loginDisplayName(auth.user?.email)}</span><button onClick={auth.signOut}>Chiqish</button></div></header><DashboardEditor key={auth.user?.id}/></main>
}

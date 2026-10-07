import {useAuth} from '@/auth/authContext'
import {LoginPage} from '@/auth/LoginPage'
import {GateMessage} from '@/auth/GateMessage'
import {DashboardEditor} from './DashboardEditor'
import './editor.css'

export function DashboardAdmin(){
 const auth=useAuth()
 if(auth.configError)return <GateMessage title={auth.configError}/>
 if(auth.loading)return <p className="de-loading">Yuklanmoqda…</p>
 if(!auth.session)return <LoginPage dashboardAdmin/>
 if(auth.rolesError)return <GateMessage title={auth.rolesError} onRetry={auth.reloadRoles} onSignOut={auth.signOut}/>
 if(!auth.hasRole('super_admin'))return <GateMessage title="Dashboard boshqaruvi uchun ruxsat yo‘q" onSignOut={auth.signOut}/>
 return <main className="de-app"><header className="de-app-header"><a href="/dashboard-admin">Y <span>Rahbar paneli <small>BOSHQARUV</small></span></a><div><a href="/admin">TV boshqaruvi</a><span>{auth.user?.email}</span><button onClick={auth.signOut}>Chiqish</button></div></header><DashboardEditor key={auth.user?.id}/></main>
}

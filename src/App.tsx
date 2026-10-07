import { lazy, Suspense } from "react"
const DashboardGate = lazy(() => import("@/dashboard/DashboardGate").then(m=>({default:m.DashboardGate})))
const DashboardAdmin = lazy(() => import("@/dashboard/DashboardAdmin").then(m=>({default:m.DashboardAdmin})))
import { AdminGate } from "@/auth/AdminGate"
import { AuthProvider } from "@/auth/AuthProvider"
import { StoreGate } from "@/data/StoreGate"
import { Slideshow } from "@/Slideshow"

function App() {
  const path = window.location.pathname

  if(path === '/dashboard-admin' || path === '/dashboard/admin') return <AuthProvider><Suspense fallback={<p>Yuklanmoqda…</p>}><DashboardAdmin/></Suspense></AuthProvider>

  if (path === "/dashboard" || path.startsWith("/dashboard/")) return <AuthProvider><Suspense fallback={<p>Yuklanmoqda…</p>}><DashboardGate /></Suspense></AuthProvider>

  // /admin: Supabase Auth first, then the admin content store.
  if (path.startsWith("/admin")) {
    if (path !== "/admin") window.history.replaceState(null, "", "/admin")
    return (
      <AuthProvider>
        <AdminGate />
      </AuthProvider>
    )
  }

  // Building TVs open published content directly, without a user session.
  return (
    <StoreGate surface="tv">
      <Slideshow />
    </StoreGate>
  )
}

export default App

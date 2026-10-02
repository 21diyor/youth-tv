import { AdminGate } from "@/auth/AdminGate"
import { AuthProvider } from "@/auth/AuthProvider"
import { StoreGate } from "@/data/StoreGate"
import { Slideshow } from "@/Slideshow"

function App() {
  const path = window.location.pathname

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

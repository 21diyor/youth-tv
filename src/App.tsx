import { AdminGate } from "@/auth/AdminGate"
import { AuthProvider } from "@/auth/AuthProvider"
import { StoreGate } from "@/data/StoreGate"
import { Slideshow } from "@/Slideshow"

function App() {
  const path = window.location.pathname

  // /admin: Supabase Auth first, then the admin content store (inside
  // AdminGate). The TV route does not require login in the frontend yet.
  if (path.startsWith("/admin")) {
    return (
      <AuthProvider>
        <AdminGate />
      </AuthProvider>
    )
  }

  return (
    <StoreGate surface="tv">
      <Slideshow />
    </StoreGate>
  )
}

export default App

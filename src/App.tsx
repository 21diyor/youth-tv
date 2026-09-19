import { AdminGate } from "@/auth/AdminGate"
import { AuthProvider } from "@/auth/AuthProvider"
import { TvGate } from "@/auth/TvGate"
import { StoreGate } from "@/data/StoreGate"
import { tvBackend } from "@/data/tvStore"
import { Slideshow } from "@/Slideshow"

function App() {
  const path = window.location.pathname

  // /admin: Supabase Auth first, then the admin content store.
  if (path.startsWith("/admin")) {
    return (
      <AuthProvider>
        <AdminGate />
      </AuthProvider>
    )
  }

  // TV on Supabase: TV (or admin) account sign-in, then published content.
  if (tvBackend === "supabase") {
    return (
      <AuthProvider>
        <TvGate />
      </AuthProvider>
    )
  }

  // TV on the local backend (rollback mode): no login, as before.
  return (
    <StoreGate surface="tv">
      <Slideshow />
    </StoreGate>
  )
}

export default App

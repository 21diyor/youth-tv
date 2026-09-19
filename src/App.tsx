import { AdminGate } from "@/auth/AdminGate"
import { AuthProvider } from "@/auth/AuthProvider"
import { Slideshow } from "@/Slideshow"

function App() {
  const path = window.location.pathname

  // Only /admin uses Supabase Auth. The TV route stays public (and does not
  // touch Supabase at all) until TV Viewer accounts exist.
  if (path.startsWith("/admin")) {
    return (
      <AuthProvider>
        <AdminGate />
      </AuthProvider>
    )
  }

  return <Slideshow />
}

export default App

import { AdminPage } from "@/admin/AdminPage"
import { Slideshow } from "@/Slideshow"

function App() {
  const path = window.location.pathname

  if (path.startsWith("/admin")) {
    return <AdminPage />
  }

  return <Slideshow />
}

export default App
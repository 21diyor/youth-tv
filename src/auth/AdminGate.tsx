import { AdminPage } from "@/admin/AdminPage"
import { useAuth } from "@/auth/authContext"
import { GateMessage } from "@/auth/GateMessage"
import { LoginPage } from "@/auth/LoginPage"
import { ADMIN_ROLES } from "@/auth/roles"
import { StoreGate } from "@/data/StoreGate"

/**
 * /admin entry point: login → role check → AdminPage.
 * This only decides what the UI shows; Supabase RLS enforces access.
 */
export function AdminGate() {
  const auth = useAuth()

  if (auth.configError) {
    return <GateMessage title={auth.configError} />
  }

  // Plain canvas while the session/roles resolve — no flash of AdminPage.
  if (auth.loading) {
    return <div className="min-h-screen bg-[#F5F5F3]" />
  }

  if (!auth.session) {
    return <LoginPage />
  }

  if (auth.rolesError) {
    return (
      <GateMessage
        title={auth.rolesError}
        onRetry={auth.reloadRoles}
        onSignOut={auth.signOut}
      />
    )
  }

  if (!ADMIN_ROLES.some((role) => auth.hasRole(role))) {
    return (
      <GateMessage
        title="Bu hisob admin paneliga kirish huquqiga ega emas"
        detail={auth.user?.email ?? undefined}
        onSignOut={auth.signOut}
      />
    )
  }

  // Auth resolved → load admin content (drafts + published), then render.
  return (
    <StoreGate key={auth.user?.id} surface="admin" userKey={auth.user?.id ?? null}>
      <AdminPage />
    </StoreGate>
  )
}

import { useState } from "react"

import { AdminPage } from "@/admin/AdminPage"
import { useAuth } from "@/auth/authContext"
import { LoginPage } from "@/auth/LoginPage"
import { ADMIN_ROLES } from "@/auth/roles"

import { Button } from "@/components/ui/button"

// Minimal full-screen message in the admin visual language.
function GateMessage({
  title,
  detail,
  onRetry,
  onSignOut,
}: {
  title: string
  detail?: string
  onRetry?: () => void
  onSignOut?: () => Promise<void>
}) {
  const [signingOut, setSigningOut] = useState(false)

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F5F3] px-[24px] text-[#171717]">
      <div className="w-full max-w-[420px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Yoshlar ishlari agentligi
        </p>

        <h1 className="mt-[7px] text-[20px] font-semibold tracking-[-0.03em]">
          {title}
        </h1>

        {detail && (
          <p className="mt-[6px] text-[13px] leading-[1.6] text-neutral-500">
            {detail}
          </p>
        )}

        {(onRetry || onSignOut) && (
          <div className="mt-[22px] flex items-center gap-[12px]">
            {onRetry && (
              <Button variant="outline" onClick={onRetry}>
                Qayta urinish
              </Button>
            )}

            {onSignOut && (
              <Button
                variant="outline"
                disabled={signingOut}
                onClick={async () => {
                  setSigningOut(true)
                  await onSignOut()
                  setSigningOut(false)
                }}
              >
                Chiqish
              </Button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

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

  return <AdminPage />
}

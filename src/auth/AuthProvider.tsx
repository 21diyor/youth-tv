import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  isAuthApiError,
  isAuthRetryableFetchError,
  type Session,
} from "@supabase/supabase-js"

import { getSupabase } from "@/lib/supabase"
import { loginEmail } from "@/auth/loginIdentifier"

import {
  AuthContext,
  type AuthContextValue,
} from "@/auth/authContext"
import { isAppRole, type AppRole } from "@/auth/roles"

function initialConfigError(): string | null {
  try {
    getSupabase()
    return null
  } catch (error) {
    console.error(error)
    return "Tizim sozlamalarida xatolik. Administratorga murojaat qiling."
  }
}

function signInErrorMessage(error: unknown): string {
  if (isAuthRetryableFetchError(error)) {
    return "Serverga ulanib bo‘lmadi. Internet aloqasini tekshiring."
  }

  if (isAuthApiError(error)) {
    if (error.code === "invalid_credentials") {
      return "Login yoki parol noto‘g‘ri."
    }

    if (
      error.code === "over_request_rate_limit" ||
      error.status === 429
    ) {
      return "Juda ko‘p urinish. Birozdan so‘ng qayta urinib ko‘ring."
    }
  }

  return "Kirishda xatolik yuz berdi. Qayta urinib ko‘ring."
}

/**
 * Supabase Auth session + the signed-in user's roles (public.user_roles).
 * Session storage and token refresh are left entirely to supabase-js.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [configError] = useState(initialConfigError)

  const [session, setSession] = useState<Session | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  const [roles, setRoles] = useState<AppRole[]>([])
  const [rolesUserId, setRolesUserId] = useState<string | null>(null)
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [rolesErrorNetwork, setRolesErrorNetwork] = useState(false)
  const [rolesRequest, setRolesRequest] = useState(0)

  // onAuthStateChange emits INITIAL_SESSION first, so it also covers the
  // initial load. Only set state here: supabase-js advises against calling
  // other Supabase APIs from inside this callback.
  useEffect(() => {
    if (configError) {
      return
    }

    const { data } = getSupabase().auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!nextSession) {
          setRolesUserId(null)
          setRoles([])
          setRolesError(null)
          setRolesErrorNetwork(false)
        }
        setSession(nextSession)
        setSessionReady(true)
      }
    )

    return () => {
      data.subscription.unsubscribe()
    }
  }, [configError])

  const userId = session?.user.id ?? null

  // Roles are re-read on every sign-in and page load, so role changes take
  // effect after refresh / re-login.
  useEffect(() => {
    if (!userId) {
      return
    }

    let cancelled = false

    getSupabase()
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data, error }) => {
        if (cancelled) {
          return
        }

        if (error) {
          console.error("[auth] Failed to load roles", error)
          setRoles([])
          setRolesError(
            "Foydalanuvchi huquqlarini yuklab bo‘lmadi. Qayta urinib ko‘ring."
          )
          // No HTTP status/code at all = Supabase was not reached.
          setRolesErrorNetwork(
            !navigator.onLine ||
              (!error.code && /fetch|network|load failed/i.test(error.message))
          )
        } else {
          setRoles(
            (data ?? [])
              .map((row) => row.role as unknown)
              .filter(isAppRole)
          )
          setRolesError(null)
          setRolesErrorNetwork(false)
        }

        setRolesUserId(userId)
      })

    return () => {
      cancelled = true
    }
  }, [userId, rolesRequest])

  const rolesReady = userId !== null && rolesUserId === userId
  const currentRoles = useMemo(
    () => (rolesReady ? roles : []),
    [rolesReady, roles]
  )

  const loading = configError
    ? false
    : !sessionReady || (userId !== null && !rolesReady)

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await getSupabase().auth.signInWithPassword({
        email: loginEmail(email, ['/dashboard-admin','/dashboard/admin'].includes(window.location.pathname)),
        password,
      })

      return error ? signInErrorMessage(error) : null
    },
    []
  )

  const signOut = useCallback(async () => {
    // "local" ends this browser's session only, not other devices'.
    const { error } = await getSupabase().auth.signOut({ scope: "local" })

    if (error) {
      console.error("[auth] Sign-out failed", error)
    }
  }, [])

  const hasRole = useCallback(
    (role: AppRole) => currentRoles.includes(role),
    [currentRoles]
  )

  const reloadRoles = useCallback(() => {
    setRolesRequest((current) => current + 1)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      roles: currentRoles,
      loading,
      rolesError: rolesReady ? rolesError : null,
      rolesErrorNetwork: rolesReady && rolesError !== null && rolesErrorNetwork,
      configError,
      signIn,
      signOut,
      hasRole,
      reloadRoles,
    }),
    [
      session,
      currentRoles,
      loading,
      rolesReady,
      rolesError,
      rolesErrorNetwork,
      configError,
      signIn,
      signOut,
      hasRole,
      reloadRoles,
    ]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

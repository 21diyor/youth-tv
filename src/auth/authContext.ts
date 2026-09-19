import { createContext, useContext } from "react"

import type { Session, User } from "@supabase/supabase-js"

import type { AppRole } from "@/auth/roles"

export type AuthContextValue = {
  session: Session | null
  user: User | null
  roles: AppRole[]
  /** True until the session (and, if signed in, its roles) are known. */
  loading: boolean
  /** Admin-safe message when roles could not be loaded. */
  rolesError: string | null
  /** Admin-safe message when the Supabase client is not configured. */
  configError: string | null
  /** Resolves to null on success, or an admin-safe error message. */
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  hasRole: (role: AppRole) => boolean
  reloadRoles: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error("useAuth must be used inside <AuthProvider>.")
  }

  return value
}

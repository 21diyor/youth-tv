import { useState, type FormEvent } from "react"

import { useAuth } from "@/auth/authContext"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginPage() {
  const { signIn } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (submitting) {
      return
    }

    // Read the fields from the form itself: browser/password-manager
    // autofill can fill them before React state has caught up.
    const formData = new FormData(event.currentTarget)
    const emailValue = String(formData.get("email") ?? "").trim()
    const passwordValue = String(formData.get("password") ?? "")

    setEmail(emailValue)
    setPassword(passwordValue)

    if (!emailValue || !passwordValue) {
      setError("Login va parolni kiriting.")
      return
    }

    setSubmitting(true)
    setError(null)

    const message = await signIn(emailValue, passwordValue)

    // On success the auth provider swaps this page out; nothing else to do.
    if (message) {
      setError(message)
      setPassword("")
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F5F3] px-[24px] text-[#171717]">
      <div className="w-full max-w-[380px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Yoshlar ishlari agentligi
        </p>

        <h1 className="mt-[7px] text-[28px] font-semibold tracking-[-0.04em]">
          TV boshqaruvi
        </h1>

        <p className="mt-[6px] text-[13px] leading-[1.6] text-neutral-500">
          Bo‘lim uchun login, Super Admin uchun email kiriting.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-[28px] space-y-[20px] border border-neutral-200 bg-white p-[26px]"
        >
          <div className="space-y-[8px]">
            <Label htmlFor="login-email">Login yoki email</Label>

            <Input
              id="login-email"
              name="email"
              type="text"
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="username"
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-[8px]">
            <Label htmlFor="login-password">Parol</Label>

            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-[12px] font-medium text-red-600"
            >
              {error}
            </p>
          )}

          {/* Only disabled while signing in: a disabled submit button would
              block native Enter-key submission of the form. */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Kirilmoqda…" : "Kirish"}
          </Button>
        </form>

        <p className="mt-[18px] text-[11px] text-neutral-400">
          TV Monitoring Platform
        </p>
      </div>
    </main>
  )
}

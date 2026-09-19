import { useState, type FormEvent } from "react"

import { useAuth } from "@/auth/authContext"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Sign-in for a TV screen (large display, keyboard / mouse / air-mouse).
 * Session persistence is left entirely to supabase-js.
 */
export function TvLoginPage() {
  const { signIn } = useAuth()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (submitting) {
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    if (!email || !password) {
      setError("Email va parolni kiriting.")
      return
    }

    setSubmitting(true)
    setError(null)

    const message = await signIn(email, password)

    // On success the TV gate swaps this screen for the slideshow.
    if (message) {
      setError(message)
      const passwordInput = form.elements.namedItem("password")

      if (passwordInput instanceof HTMLInputElement) {
        passwordInput.value = ""
        passwordInput.focus()
      }

      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#FAFAF9] px-[32px] text-[#171717]">
      <div className="w-full max-w-[520px]">
        <p className="text-[14px] font-semibold uppercase tracking-[0.19em] text-neutral-500">
          Yoshlar ishlari agentligi
        </p>

        <h1 className="mt-[10px] text-[40px] font-semibold leading-none tracking-[-0.045em]">
          TV ekrani
        </h1>

        <div className="mt-[18px] h-[4px] w-[46px] bg-[#1D4ED8]" />

        <p className="mt-[18px] text-[16px] leading-[1.6] text-neutral-500">
          Ushbu ekran uchun TV hisobi bilan kiring.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-[32px] space-y-[22px] border-t border-neutral-200 pt-[28px]"
        >
          <div className="space-y-[10px]">
            <Label htmlFor="tv-login-email" className="text-[15px]">
              Email
            </Label>

            <Input
              id="tv-login-email"
              name="email"
              type="email"
              autoComplete="username"
              autoFocus
              disabled={submitting}
              className="h-[52px] px-[16px] text-[18px] md:text-[18px]"
            />
          </div>

          <div className="space-y-[10px]">
            <Label htmlFor="tv-login-password" className="text-[15px]">
              Parol
            </Label>

            <Input
              id="tv-login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              disabled={submitting}
              className="h-[52px] px-[16px] text-[18px] md:text-[18px]"
            />
          </div>

          {error && (
            <p role="alert" className="text-[15px] font-medium text-red-600">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="h-[52px] w-full bg-[#1D4ED8] text-[17px] hover:bg-[#1D4ED8]/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Kirilmoqda…" : "Kirish"}
          </Button>
        </form>

        <p className="mt-[22px] text-[13px] text-neutral-400">
          TV Monitoring Platform
        </p>
      </div>
    </main>
  )
}

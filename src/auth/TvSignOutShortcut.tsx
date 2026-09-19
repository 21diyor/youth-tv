import { useEffect, useRef, useState } from "react"

import { useAuth } from "@/auth/authContext"
import { clearTvDeviceCache } from "@/auth/tvAccessMarker"

import { Button } from "@/components/ui/button"

/**
 * Hidden TV sign-out: Ctrl+Shift+L opens a small confirmation. Nothing is
 * rendered over the slideshow until the shortcut is pressed; the default
 * focus is "Bekor qilish", so an accidental Enter does not sign out.
 * Esc closes the dialog.
 */
export function TvSignOutShortcut() {
  const { signOut, user } = useAuth()

  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.ctrlKey &&
        event.shiftKey &&
        !event.altKey &&
        event.key.toLowerCase() === "l"
      ) {
        event.preventDefault()
        setOpen(true)
      }

      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus()
    }
  }, [open])

  if (!open) {
    return null
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    // Deliberate device reset: forget the verified-access marker and the
    // cached published snapshot first, then end the Supabase session.
    clearTvDeviceCache()
    await signOut()
    // Full reload resets the TV store, realtime channel and timers.
    window.location.reload()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tv-signout-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20"
    >
      <div className="w-full max-w-[440px] border border-neutral-200 bg-white px-[28px] py-[24px] text-[#171717]">
        <h2
          id="tv-signout-title"
          className="text-[20px] font-semibold tracking-[-0.03em]"
        >
          TV hisobidan chiqilsinmi?
        </h2>

        <p className="mt-[6px] text-[14px] leading-[1.55] text-neutral-500">
          {user?.email}
          <br />
          Chiqqandan so‘ng ekran qayta kirishni talab qiladi.
        </p>

        <div className="mt-[22px] flex items-center justify-end gap-[12px]">
          <Button
            ref={cancelRef}
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={signingOut}
          >
            Bekor qilish
          </Button>

          <Button
            onClick={handleSignOut}
            disabled={signingOut}
            className="bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {signingOut ? "Chiqilmoqda…" : "Chiqish"}
          </Button>
        </div>
      </div>
    </div>
  )
}

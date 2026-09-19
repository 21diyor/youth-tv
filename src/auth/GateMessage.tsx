import { useState } from "react"

import { Button } from "@/components/ui/button"

// Minimal full-screen message in the admin visual language.
// `canvas` matches the surface: admin #F5F5F3, TV #FAFAF9.
export function GateMessage({
  title,
  detail,
  onRetry,
  onSignOut,
  canvas = "bg-[#F5F5F3]",
}: {
  title: string
  detail?: string
  onRetry?: () => void
  onSignOut?: () => Promise<void>
  canvas?: string
}) {
  const [signingOut, setSigningOut] = useState(false)

  return (
    <main
      className={`flex min-h-screen items-center justify-center px-[24px] text-[#171717] ${canvas}`}
    >
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

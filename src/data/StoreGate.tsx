import { useEffect, useState, type ReactNode } from "react"

import {
  initTvStore,
  isTvStoreReady,
  type TvSurface,
} from "@/data/tvStore"

import { Button } from "@/components/ui/button"

type GateState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; message: string }

/**
 * Renders children only once the content store is ready for `surface`.
 * TV can reuse a ready store. Admin always initializes for the current user
 * before rendering. Failed loads show an error with a retry action.
 */
export function StoreGate({
  surface,
  userKey,
  children,
}: {
  surface: TvSurface
  userKey?: string | null
  children: ReactNode
}) {
  const [state, setState] = useState<GateState>(() =>
    // Admin initialization validates the user before exposing cached drafts.
    surface === "tv" && isTvStoreReady(surface)
      ? { status: "ready" }
      : { status: "loading" }
  )
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    initTvStore({ surface, userKey }).then(
      () => {
        if (!cancelled) {
          setState({ status: "ready" })
        }
      },
      (error: unknown) => {
        if (cancelled) {
          return
        }

        console.error("[store] init failed", error)
        setState({
          status: "error",
          message:
            error instanceof Error && error.message
              ? error.message
              : "Ma’lumotlarni yuklab bo‘lmadi. Qayta urinib ko‘ring.",
        })
      }
    )

    return () => {
      cancelled = true
    }
  }, [surface, userKey, attempt])

  if (state.status === "ready") {
    return children
  }

  const canvas =
    surface === "tv" ? "bg-[#FAFAF9]" : "bg-[#F5F5F3]"

  if (state.status === "loading") {
    return <div className={`min-h-screen ${canvas}`} />
  }

  return (
    <main
      className={`flex min-h-screen items-center justify-center px-[24px] text-[#171717] ${canvas}`}
    >
      <div className="w-full max-w-[460px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Yoshlar ishlari agentligi
        </p>

        <h1 className="mt-[7px] text-[20px] font-semibold tracking-[-0.03em]">
          Ma’lumotlarni yuklab bo‘lmadi
        </h1>

        <p className="mt-[6px] text-[13px] leading-[1.6] text-neutral-500">
          {state.message}
        </p>

        <div className="mt-[22px]">
          <Button
            variant="outline"
            onClick={() => {
              setState({ status: "loading" })
              setAttempt((current) => current + 1)
            }}
          >
            Qayta urinish
          </Button>
        </div>
      </div>
    </main>
  )
}

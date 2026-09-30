import { OverviewContent } from "@/admin/OverviewContent"
import { useState } from "react"
import { PresidentEditor } from "@/admin/PresidentEditor"
import { EmployeeEditor } from "@/admin/EmployeeEditor"
import { AppealsEditor } from "@/admin/AppealsEditor"
import { SlideSettingsEditor } from "@/admin/SlideSettingsEditor"

import { useAuth } from "@/auth/authContext"
import {
  canSeeSection,
  type AdminSection,
} from "@/auth/roles"

type Section = AdminSection

// "mr.diyor7736@gmail.com" → "MD"; "admin@x.uz" → "AD".
function initialsFromEmail(email: string | undefined): string {
  const local = (email ?? "").split("@")[0] ?? ""
  const parts = local
    .split(/[._-]+/)
    .map((part) => part.replace(/[^a-zA-Z]/g, ""))
    .filter(Boolean)

  const initials =
    parts.length > 1
      ? parts[0][0] + parts[1][0]
      : (parts[0] ?? "").slice(0, 2)

  return initials.toUpperCase() || "—"
}

const menuItems: {
  id: Section
  title: string
  description: string
}[] = [
  {
    id: "overview",
    title: "Umumiy ko‘rinish",
    description: "Tizim holati",
  },
  {
    id: "president",
    title: "Prezident fikri",
    description: "Iqtibos va rasm",
  },
  {
    id: "appeals",
    title: "Fuqarolar murojaatlari",
    description: "Statistika va analitika",
  },
  {
    id: "employee",
    title: "Oy xodimi",
    description: "Xodim ma’lumotlari",
  },
  {
    id: "settings",
    title: "Slayd sozlamalari",
    description: "TV va interval",
  },
]

export function AdminPage() {
  const { user, roles, signOut } = useAuth()

  // Menu follows the user's roles (union across roles). RLS is the real
  // protection; this only hides sections the user cannot act on.
  const visibleItems = menuItems.filter((item) =>
    canSeeSection(item.id, roles)
  )

  const [activeSection, setActiveSection] = useState<Section>(
    () => visibleItems[0]?.id ?? "overview"
  )

  const [signingOut, setSigningOut] = useState(false)

  const currentItem =
    visibleItems.find((item) => item.id === activeSection) ??
    visibleItems[0] ??
    menuItems[0]

  const showSection = (section: Section) =>
    currentItem.id === section && canSeeSection(section, roles)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    setSigningOut(false)
  }

  return (
    <main className="min-h-screen bg-[#F5F5F3] text-[#171717]">
      <div className="grid min-h-screen grid-cols-[280px_1fr]">

        {/* SIDEBAR */}
        <aside className="flex min-h-screen flex-col border-r border-neutral-200 bg-white px-[22px] py-[26px]">
          <div className="border-b border-neutral-200 pb-[24px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Yoshlar ishlari agentligi
            </p>

            <h1 className="mt-[7px] text-[22px] font-semibold tracking-[-0.035em]">
              TV boshqaruvi
            </h1>
          </div>

          <nav className="mt-[22px] space-y-[4px]">
            {visibleItems.map((item) => {
              const active = currentItem.id === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full px-[14px] py-[12px] text-left transition-colors ${
                    active
                      ? "bg-[#F0F4FF] text-[#1D4ED8]"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <p className="text-[13px] font-semibold">
                    {item.title}
                  </p>

                  <p
                    className={`mt-[2px] text-[11px] ${
                      active
                        ? "text-[#1D4ED8]/65"
                        : "text-neutral-400"
                    }`}
                  >
                    {item.description}
                  </p>
                </button>
              )
            })}
          </nav>

          <div className="mt-auto border-t border-neutral-200 pt-[18px]">
            <p className="text-[11px] font-medium text-neutral-400">
              TV Monitoring Platform
            </p>

            <p className="mt-[4px] text-[11px] text-neutral-400">
              v1.0
            </p>
          </div>
        </aside>

        {/* MAIN */}
        <section className="min-w-0">

          {/* TOP BAR */}
          <header className="flex h-[82px] items-center justify-between border-b border-neutral-200 bg-white px-[38px]">
            <div>
              <h2 className="text-[20px] font-semibold tracking-[-0.025em]">
                {currentItem.title}
              </h2>

              <p className="mt-[3px] text-[12px] text-neutral-500">
                {currentItem.description}
              </p>
            </div>

            <div className="flex items-center gap-[12px]">
              <a
                href="/"
                target="_blank"
                className="border border-neutral-200 bg-white px-[15px] py-[9px] text-[12px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                TV ekranini ochish
              </a>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="border border-neutral-200 bg-white px-[15px] py-[9px] text-[12px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Chiqish
              </button>

              <span className="text-[12px] text-neutral-500">
                {user?.email}
              </span>

              <div
                title={user?.email}
                className="flex h-[36px] w-[36px] items-center justify-center bg-[#1D4ED8] text-[12px] font-semibold text-white"
              >
                {initialsFromEmail(user?.email)}
              </div>
            </div>
          </header>

          {/* CONTENT */}
          <div className="p-[38px]">
            <div className="mx-auto max-w-[1500px]">

              {showSection("overview") && (
                <OverviewContent />
              )}

              {showSection("president") && (
                <PresidentEditor />
                )}

              {showSection("appeals") && (
                <AppealsEditor />
                )}

              {showSection("employee") && (
                <EmployeeEditor />
                )}

              {showSection("settings") && (
                <SlideSettingsEditor />
                )}

            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
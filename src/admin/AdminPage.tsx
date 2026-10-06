import { lazy, Suspense } from "react"
const DashboardEditor = lazy(() => import("@/dashboard/DashboardEditor").then(m=>({default:m.DashboardEditor})))
import { OverviewContent } from "@/admin/OverviewContent"
import { loginDisplayName } from "@/auth/loginIdentifier"
import { ScheduleEditor, ManagersEditor } from "@/admin/DepartmentEditors"
import { ScheduledHrEditor } from "@/admin/ScheduledHrEditor"
import { useState } from "react"
import { PresidentEditor } from "@/admin/PresidentEditor"
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
  {id: "dashboardData", title: "Rahbar paneli ma’lumotlari", description: "Hisobot va ko‘rsatkichlar"},
  { id: "managers", title: "Rahbariyat shaxsiy qabullari", description: "Murojaatlar bo‘limi" },
  { id: "schedule", title: "Rahbariyat qabul jadvali", description: "HR bo‘limi" },
  { id: "staff", title: "Xodimlar", description: "Yagona xodimlar ro‘yxati" },
  { id: "birthday", title: "Tug‘ilgan kunlar", description: "Avtomatik tabriklar" },
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
  const [adminTheme, setAdminTheme] = useState(() => {
    try { return localStorage.getItem("youth-tv-admin-theme") === "dark" ? "dark" : "light" } catch { return "light" }
  })
  const toggleTheme = () => {
    const next = adminTheme === "light" ? "dark" : "light"
    setAdminTheme(next)
    try { localStorage.setItem("youth-tv-admin-theme", next) } catch { /* Theme still works without storage. */ }
  }

  // Menu follows the user's roles (union across roles). RLS is the real
  // protection; this only hides sections the user cannot act on.
  const visibleItems = menuItems.filter((item) =>
    canSeeSection(item.id, roles)
  ).sort((a, b) => {
    const order: Section[] = ["overview", "appeals", "managers", "schedule", "staff", "employee", "birthday", "president", "dashboardData", "settings"]
    return order.indexOf(a.id) - order.indexOf(b.id)
  })

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

  if (!visibleItems.length) return <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50"><h1 className="text-xl font-semibold">Bu bo‘lim uchun ruxsat mavjud emas</h1><a href="/admin" className="text-blue-700 underline">Admin paneliga qaytish</a></main>

  return (
    <main data-admin-theme={adminTheme} className="admin-surface min-h-screen bg-[#F5F5F3] text-[#171717]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">

        {/* SIDEBAR */}
        <aside className="flex lg:min-h-screen flex-col border-r border-neutral-200 bg-white px-[22px] py-[26px]">
          <div className="border-b border-neutral-200 pb-[24px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Yoshlar ishlari agentligi
            </p>

            <h1 className="mt-[7px] text-[22px] font-semibold tracking-[-0.035em]">
              {roles.includes("super_admin") ? "Super Admin" : roles.includes("hr_admin") ? "HR bo‘limi" : roles.includes("appeals_admin") ? "Murojaatlar bo‘limi" : "TV boshqaruvi"}
            </h1>
          </div>

          <nav className="mt-[22px] flex gap-1 overflow-x-auto lg:block lg:space-y-[4px]">
            {visibleItems.map((item) => {
              const active = currentItem.id === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-auto shrink-0 lg:w-full px-[14px] py-[12px] text-left transition-colors ${
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

          <div className="hidden lg:block mt-auto border-t border-neutral-200 pt-[18px]">
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
          <header className="flex min-h-[82px] flex-wrap items-center justify-between gap-4 border-b border-neutral-200 bg-white px-5 py-4 lg:px-[38px]">
            <div>
              <h2 className="text-[20px] font-semibold tracking-[-0.025em]">
                {currentItem.title}
              </h2>

              <p className="mt-[3px] text-[12px] text-neutral-500">
                {currentItem.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-[12px]">
              <button type="button" onClick={toggleTheme} aria-label="Admin mavzusini almashtirish" aria-pressed={adminTheme === "dark"} className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold">{adminTheme === "dark" ? "☀ Yorug‘ rejim" : "☾ Tungi rejim"}</button>
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
                {loginDisplayName(user?.email)}
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
          <div className="p-5 lg:p-[38px]">
            <div className="mx-auto max-w-[1500px]">

              {showSection("dashboardData") && <Suspense fallback={<p>Yuklanmoqda…</p>}><DashboardEditor /></Suspense>}
              {showSection("overview") && (
                <OverviewContent />
              )}
              {showSection("schedule") && <ScheduleEditor />}
              {showSection("managers") && <ManagersEditor />}
              {showSection("staff") && <ScheduledHrEditor key="staff" mode="staff" />}
              {showSection("birthday") && <ScheduledHrEditor key="birthday" mode="birthday" onOpenStaff={() => setActiveSection("staff")} />}

              {showSection("president") && (
                <PresidentEditor />
                )}

              {showSection("appeals") && (
                <AppealsEditor />
                )}

              {showSection("employee") && (
                <ScheduledHrEditor key="employee" mode="employee" onOpenStaff={() => setActiveSection("staff")} />
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

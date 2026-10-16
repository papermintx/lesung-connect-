import { useState } from "react"
import {
  Check,
  ChevronDown,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { DUMMY_USERS, resetMockDataToDefault } from "@/data/mockData"
import type { User } from "@/types/inbox"

type RoleSwitcherProps = {
  currentUser: User
  onSwitchUser: (username: string) => void
}

export function RoleSwitcher({ currentUser, onSwitchUser }: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showResetNotice, setShowResetNotice] = useState(false)

  const usersList = Object.values(DUMMY_USERS)

  function handleSelect(username: string) {
    onSwitchUser(username)
    setIsOpen(false)
  }

  function handleReset() {
    resetMockDataToDefault()
    setShowResetNotice(true)
    setTimeout(() => setShowResetNotice(false), 2500)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-border bg-background/90 px-2.5 py-1.5 text-left shadow-xs transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
        title="Klik untuk ganti peran (Role Switcher)"
      >
        <div
          className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${currentUser.avatarBg}`}
        >
          {currentUser.initials}
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-xs font-semibold">{currentUser.name}</span>
            <span
              className={`rounded px-1 py-0.2 text-[10px] font-medium uppercase tracking-wider ${
                currentUser.role === "admin"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : currentUser.role === "supervisor"
                    ? "bg-purple-500/15 text-purple-700 dark:text-purple-400"
                    : "bg-blue-500/15 text-blue-700 dark:text-blue-400"
              }`}
            >
              {currentUser.role}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">{currentUser.title}</span>
        </div>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b px-2.5 pb-2 pt-1">
              <div>
                <p className="text-xs font-semibold">Simulasi Peran (Role Switcher)</p>
                <p className="text-[11px] text-muted-foreground">Pilih persona untuk menguji hak akses</p>
              </div>
              <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Sparkles className="size-3.5" />
              </div>
            </div>

            <div className="mt-1 space-y-1">
              {usersList.map((user) => {
                const isActive = user.username === currentUser.username
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user.username)}
                    className={`flex w-full items-start gap-2.5 rounded-lg p-2 text-left transition ${
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${user.avatarBg}`}
                    >
                      {user.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{user.name}</span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase ${
                            user.role === "admin"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : user.role === "supervisor"
                                ? "bg-purple-500/15 text-purple-700 dark:text-purple-400"
                                : "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{user.title}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/80 leading-tight">
                        {user.role === "admin" &&
                          "Akses penuh, monitoring semua chat, takeover, transfer & koneksi WA."}
                        {user.role === "supervisor" &&
                          "Supervisi antrean & beban sales, takeover serta transfer chat."}
                        {user.role === "sales" &&
                          "Fokus chat pribadi, klaim antrean baru, dan membalas chat miliknya."}
                      </p>
                    </div>
                    {isActive && <Check className="size-4 text-primary shrink-0 mt-1" />}
                  </button>
                )
              })}
            </div>

            <div className="mt-2 border-t pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
              >
                <RotateCcw className="size-3.5" />
                Reset Data Dummy ke Semula
              </button>
            </div>
          </div>
        </>
      )}

      {showResetNotice && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background shadow-lg animate-in slide-in-from-bottom">
          <RotateCcw className="size-3.5 text-emerald-400" />
          Data dummy berhasil di-reset ke kondisi awal!
        </div>
      )}
    </div>
  )
}

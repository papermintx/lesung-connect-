import { useState } from "react"
import {
  ArrowRight,
  Eye,
  EyeOff,
  Headphones,
  LockKeyhole,
  MessageCircle,
  Radio,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DUMMY_USERS } from "@/data/mockData"

type LoginPageProps = {
  onLogin: (username: string, password: string) => Promise<void>
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("admin.test")
  const [password, setPassword] = useState("password123")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const usersList = Object.values(DUMMY_USERS)

  async function handleQuickLogin(userUsername: string) {
    setUsername(userUsername)
    setPassword("password123")
    setError("")
    setLoading(true)
    try {
      await onLogin(userUsername, "password123")
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login gagal.")
    } finally {
      setLoading(false)
    }
  }

  async function submit() {
    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi.")
      return
    }
    setError("")
    setLoading(true)
    try {
      await onLogin(username.trim(), password)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login gagal.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-muted/20 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Left Hero Section */}
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-80 rounded-full border-40 border-white/10" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full border-50 border-white/10" />
        
        <Brand light />

        <div className="relative max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground backdrop-blur-xs">
            <Radio className="size-3 text-emerald-400 animate-pulse" />
            Shared WhatsApp Multi-Agent
          </div>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.08] tracking-tight">
            Satu nomor WhatsApp, dikelola bersama seluruh tim.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-primary-foreground/75">
            Tingkatkan respon customer tanpa berebut chat. Sistem antrean pintar,
            ownership claim untuk sales, serta pengawasan & kontrol penuh untuk admin.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 text-xs text-primary-foreground/80">
            <div className="flex items-start gap-2.5 rounded-xl bg-white/10 p-3 backdrop-blur-xs">
              <ShieldCheck className="size-5 shrink-0 text-emerald-300" />
              <div>
                <p className="font-semibold text-white">Mode Admin / Supervisor</p>
                <p className="mt-0.5 text-white/70">Kontrol koneksi WA, takeover chat, pantau SLA & transfer leads.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-white/10 p-3 backdrop-blur-xs">
              <Headphones className="size-5 shrink-0 text-blue-300" />
              <div>
                <p className="font-semibold text-white">Mode Tim Sales</p>
                <p className="mt-0.5 text-white/70">Klaim antrean, fokus chat pribadi, update status prospek & cepat deal.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-between text-xs text-primary-foreground/50 border-t border-white/10 pt-4">
          <p>© 2026 LesungConnect • Multi-Agent WhatsApp Inbox</p>
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="size-2 rounded-full bg-emerald-400" /> Mode Mock Data Aktif
          </span>
        </div>
      </section>

      {/* Right Login Section */}
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-115">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">Masuk ke Workspace</h2>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Sparkles className="size-3" /> Dummy Ready
              </span>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Pilih salah satu akun demo di bawah untuk langsung mencoba hak akses:
            </p>
          </div>

          {/* Quick Persona Cards (1-Click Switch & Login) */}
          <div className="mb-6 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pilih Cepat Akun Demo (1-Click Login):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {usersList.map((user) => {
                const isSelected = username === user.username
                return (
                  <button
                    key={user.id}
                    type="button"
                    disabled={loading}
                    onClick={() => void handleQuickLogin(user.username)}
                    className={`group relative flex items-start gap-2.5 rounded-xl border p-3 text-left transition hover:border-primary/50 hover:shadow-sm ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border bg-card"
                    }`}
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${user.avatarBg}`}
                    >
                      {user.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold truncate text-foreground">
                          {user.name.split(" ")[0]}
                        </p>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider ${
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
                      <p className="text-[10px] text-muted-foreground truncate">{user.title}</p>
                      <span className="mt-1 inline-flex items-center text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                        Klik untuk masuk <ArrowRight className="size-2.5 ml-0.5" />
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="relative my-6 text-center text-xs text-muted-foreground">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <span className="relative bg-background px-3 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
              atau masuk manual
            </span>
          </div>

          {/* Manual Input Form */}
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
          >
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-foreground">Username</span>
              <div className="relative">
                <UserRound className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  placeholder="admin.test / sales.rina / sales.dimas"
                  autoComplete="username"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-foreground">Password</span>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-10 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  placeholder="Ketik password apa saja"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive border border-destructive/20 font-medium">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-10 w-full font-medium transition cursor-pointer"
            >
              {loading ? "Memproses..." : "Masuk ke Workspace"}
              {!loading && <ArrowRight className="ml-1.5 size-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            💡 <strong>Info:</strong> Mode demo menggunakan dummy storage browser sehingga Anda bebas menguji klaim, kirim pesan, dan transfer chat tanpa server backend aktif.
          </p>
        </div>
      </section>
    </main>
  )
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex size-9 items-center justify-center rounded-xl shadow-xs ${
          light ? "bg-white/15 text-white" : "bg-primary text-primary-foreground"
        }`}
      >
        <MessageCircle className="size-5" />
      </div>
      <div>
        <p className="font-bold tracking-tight text-base leading-none">
          Lesung<span className={light ? "text-white/80" : "text-primary"}>Connect</span>
        </p>
        <p className={`text-[10px] mt-0.5 ${light ? "text-white/60" : "text-muted-foreground"}`}>
          WhatsApp Shared Inbox
        </p>
      </div>
    </div>
  )
}

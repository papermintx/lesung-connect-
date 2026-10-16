import { useEffect, useState } from "react"
import QRCode from "qrcode"
import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LogOut,
  Phone,
  QrCode,
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getStoredWhatsAppStatus,
  setStoredWhatsAppStatus,
  subscribeMockStore,
} from "@/data/mockData"
import {
  connectSocket,
  connectWhatsApp,
  logoutWhatsApp,
  requestWhatsAppStatus,
  restartWhatsApp,
  socket,
} from "@/lib/socket"
import type { WhatsAppState, WhatsAppStatus } from "@/types/whatsapp"

type WhatsAppConnectionPageProps = {
  onBack: () => void
}

const stateCopy: Record<WhatsAppState, { label: string; description: string }> = {
  disconnected: {
    label: "Belum terhubung",
    description: "Hubungkan nomor WhatsApp untuk mulai menerima pesan dari customer.",
  },
  authenticating: {
    label: "Mengautentikasi",
    description: "WhatsApp sedang menyiapkan sesi koneksi.",
  },
  qr: {
    label: "Menunggu scan QR",
    description: "Buka WhatsApp di ponsel kantor lalu scan QR code di bawah.",
  },
  ready: {
    label: "Terhubung",
    description: "Nomor WhatsApp siap digunakan bersama oleh seluruh tim.",
  },
  failed: {
    label: "Koneksi gagal",
    description: "Koneksi WhatsApp gagal. Silakan coba mulai ulang sesi.",
  },
}

export function WhatsAppConnectionPage({ onBack }: WhatsAppConnectionPageProps) {
  const [status, setStatus] = useState<WhatsAppStatus>(() => getStoredWhatsAppStatus())
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState("")
  const [error, setError] = useState("")
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [isMockMode, setIsMockMode] = useState(true)

  useEffect(() => {
    // Subscribe to local mock changes
    const unsubscribe = subscribeMockStore(() => {
      setStatus(getStoredWhatsAppStatus())
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    let cancelled = false

    async function checkRealOrMock() {
      try {
        setLoading(true)
        // Try real socket/API first
        await connectSocket()
        const realStatus = await requestWhatsAppStatus()
        if (!cancelled) {
          setStatus(realStatus)
          setIsMockMode(false)
        }
      } catch {
        // Fallback to mock status without noisy error
        if (!cancelled) {
          setIsMockMode(true)
          const mock = getStoredWhatsAppStatus()
          setStatus(mock)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void checkRealOrMock()

    function handleRealStatus(nextStatus: WhatsAppStatus) {
      setStatus(nextStatus)
      if (nextStatus.qr) {
        void QRCode.toDataURL(nextStatus.qr).then(setQrImage).catch(() => setQrImage(null))
      }
    }

    socket.on("wa:status", handleRealStatus)
    return () => {
      cancelled = true
      socket.off("wa:status", handleRealStatus)
    }
  }, [])

  async function runAction(actionName: "connect" | "restart" | "logout") {
    try {
      setAction(actionName)
      setError("")

      if (!isMockMode) {
        // Real API call
        const nextStatus =
          actionName === "connect"
            ? await connectWhatsApp()
            : actionName === "restart"
              ? await restartWhatsApp()
              : await logoutWhatsApp()
        setStatus(nextStatus)
      } else {
        // Mock simulation
        setLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 600))

        if (actionName === "logout") {
          const newStatus: WhatsAppStatus = {
            state: "disconnected",
            phoneNumber: null,
            connectedAt: null,
          }
          setStoredWhatsAppStatus(newStatus)
          setStatus(newStatus)
          setQrImage(null)
        } else if (actionName === "connect") {
          // Generate a real dummy QR image
          const dummyQrString = `2@lesung-connect-mock-qr-${Date.now()}`
          const url = await QRCode.toDataURL(dummyQrString)
          setQrImage(url)
          const qrStatus: WhatsAppStatus = {
            state: "qr",
            phoneNumber: null,
            connectedAt: null,
            qr: dummyQrString,
          }
          setStoredWhatsAppStatus(qrStatus)
          setStatus(qrStatus)

          // Auto-connect after 3 seconds for smooth demo
          setTimeout(() => {
            const connectedStatus: WhatsAppStatus = {
              state: "ready",
              ready: true,
              phoneNumber: "6281288991234",
              connectedAt: new Date().toISOString(),
            }
            setStoredWhatsAppStatus(connectedStatus)
            setStatus(connectedStatus)
            setQrImage(null)
          }, 3500)
        } else if (actionName === "restart") {
          const readyStatus: WhatsAppStatus = {
            state: "ready",
            ready: true,
            phoneNumber: "6281288991234",
            connectedAt: new Date().toISOString(),
          }
          setStoredWhatsAppStatus(readyStatus)
          setStatus(readyStatus)
        }
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Aksi WhatsApp gagal dijalankan.",
      )
    } finally {
      setAction("")
      setLoading(false)
    }
  }

  const copy = stateCopy[status.state] ?? stateCopy.disconnected
  const isReady = status.state === "ready"

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="flex h-18 items-center justify-between border-b bg-background px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Kembali ke inbox
          </Button>
          <span className="hidden text-muted-foreground sm:inline">/</span>
          <h1 className="hidden text-sm font-semibold sm:block">Koneksi WhatsApp</h1>
        </div>

        <div className="flex items-center gap-3">
          {isMockMode && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Sparkles className="size-3" /> Dummy Simulator
            </span>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={`size-2 rounded-full ${
                isReady ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
              }`}
            />
            {copy.label}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
            PENGATURAN CHANNEL • KHUSUS ADMIN
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">Koneksi Nomor WhatsApp</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Kelola satu nomor WhatsApp resmi yang dipakai bersama oleh seluruh tim sales.
            Sales membalas chat langsung dari Shared Inbox tanpa perlu menghubungkan HP masing-masing.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-2xl border bg-background p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div
                  className={`flex size-12 items-center justify-center rounded-xl ${
                    isReady
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isReady ? <Wifi className="size-6" /> : <WifiOff className="size-6" />}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{copy.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
                </div>
              </div>
              {loading ? (
                <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
              ) : isReady ? (
                <CheckCircle2 className="size-6 text-emerald-500" />
              ) : null}
            </div>

            {isReady && (
              <div className="mt-8 grid gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Nomor WhatsApp Aktif</p>
                  <p className="mt-1 flex items-center gap-2 text-base font-semibold">
                    <Phone className="size-4 text-emerald-600" />
                    +{status.phoneNumber ?? "6281288991234"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Terhubung Sejak</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
                    <Clock3 className="size-4 text-muted-foreground" />
                    {status.connectedAt
                      ? new Date(status.connectedAt).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Hari ini"}
                  </p>
                </div>
              </div>
            )}

            {status.state === "qr" && qrImage && (
              <div className="mt-8 flex flex-col items-center rounded-xl border border-dashed bg-muted/20 p-6 text-center">
                <div className="mb-4 flex size-52 items-center justify-center rounded-xl bg-white p-2 shadow-md">
                  <img src={qrImage} alt="QR code WhatsApp" className="size-48" />
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <QrCode className="size-4 text-primary" />
                  Scan QR code dengan WhatsApp di HP Anda
                </div>
                <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                  (Simulasi: Dalam 3 detik koneksi akan otomatis terhubung untuk demonstrasi)
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-2.5">
              {(status.state === "disconnected" || status.state === "failed") && (
                <Button
                  onClick={() => void runAction("connect")}
                  disabled={Boolean(action) || loading}
                >
                  {action === "connect" ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Wifi className="size-4" />
                  )}
                  Hubungkan WhatsApp
                </Button>
              )}
              {isReady && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => void runAction("restart")}
                    disabled={Boolean(action) || loading}
                  >
                    <RefreshCw
                      className={`size-4 ${action === "restart" ? "animate-spin" : ""}`}
                    />
                    Mulai Ulang Sesi
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => void runAction("logout")}
                    disabled={Boolean(action) || loading}
                  >
                    <LogOut className="size-4" />
                    Putuskan (Logout)
                  </Button>
                </>
              )}
              {status.state === "qr" && (
                <Button
                  variant="outline"
                  onClick={() => void runAction("connect")}
                  disabled={Boolean(action) || loading}
                >
                  <RefreshCw className="size-4" />
                  Regenerasi QR
                </Button>
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-background p-6 shadow-sm">
            <h3 className="font-semibold text-base">Panduan Penggunaan</h3>
            <div className="mt-5 space-y-4">
              {[
                "Pastikan hanya Admin/Supervisor yang mengakses halaman ini.",
                "Klik tombol Hubungkan WhatsApp untuk memulai inisialisasi sesi server.",
                "Scan kode QR menggunakan fitur 'Perangkat Tertaut' pada WhatsApp di ponsel kantor.",
                "Setelah berstatus Terhubung, seluruh sales bisa langsung membalas chat customer dari Shared Inbox.",
              ].map((item, index) => (
                <div className="flex gap-3" key={item}>
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl bg-blue-500/10 p-4 text-xs text-blue-900 dark:text-blue-300">
              <p className="font-semibold">Keamanan Multi-Agent</p>
              <p className="mt-1 leading-5 text-blue-800/80 dark:text-blue-300/80">
                Data percakapan dienkripsi dan nomor customer aman. Akun sales tidak dapat
                mengakses QR code atau memutuskan koneksi nomor WhatsApp perusahaan.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

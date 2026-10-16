import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  ArrowRightLeft,
  Bell,
  Check,
  CheckCheck,
  Clock,
  Clock3,
  Filter,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  ShieldAlert,
  UserCheck,
  Users,
  Wifi,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoginPage } from "@/components/LoginPage"
import { RoleSwitcher } from "@/components/RoleSwitcher"
import { ResizableDivider } from "@/components/ui/ResizableDivider"
import { WhatsAppConnectionPage } from "@/components/WhatsAppConnectionPage"
import {
  TakeoverModal,
  TransferModal,
} from "@/components/modals/ActionModals"
import {
  DUMMY_USERS,
  getStoredConversations,
  getStoredMessages,
  mockClaimConversation,
  mockMarkConversationRead,
  mockReleaseConversation,
  mockSendMessage,
  mockTakeoverConversation,
  mockTransferConversation,
  subscribeMockStore,
} from "@/data/mockData"
import type {
  Conversation,
  Message as ChatMessage,
  User,
} from "@/types/inbox"
import "./App.css"

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Shared Inbox", icon: Inbox, active: true },
  { label: "Customers", icon: Users },
  { label: "Reports", icon: LayoutDashboard },
]

type DashboardProps = {
  currentUser: User
  onSwitchUser: (username: string) => void
  onOpenConnection: () => void
  onLogout: () => void
}

function Dashboard({
  currentUser,
  onSwitchUser,
  onOpenConnection,
  onLogout,
}: DashboardProps) {
  const [navigationCollapsed, setNavigationCollapsed] = useState(
    () => localStorage.getItem("lesung-connect-navigation-collapsed") === "true",
  )
  const [customerPanelVisible, setCustomerPanelVisible] = useState(
    () => localStorage.getItem("lesung-connect-customer-panel-visible") !== "false",
  )
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    getStoredConversations(),
  )
  const [selectedId, setSelectedId] = useState<string>(() => {
    const list = getStoredConversations()
    return list[0]?.id ?? ""
  })
  const [filter, setFilter] = useState<string>(() =>
    currentUser.role === "sales" ? "mine" : "all",
  )
  const [search, setSearch] = useState("")
  const [draft, setDraft] = useState("")
  const [mobilePanel, setMobilePanel] = useState<"list" | "chat" | "info">("chat")
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(() =>
    getStoredMessages(),
  )
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false)

  // Resizable width for conversation list panel (min: 260px, max: 520px, default: 340px)
  const [inboxWidth, setInboxWidth] = useState<number>(() => {
    const saved = localStorage.getItem("lesung-connect-inbox-width")
    if (saved) {
      const parsed = Number(saved)
      if (!isNaN(parsed) && parsed >= 260 && parsed <= 520) return parsed
    }
    return 340
  })
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
  )

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  function handleResizeInbox(newWidth: number) {
    setInboxWidth(newWidth)
    localStorage.setItem("lesung-connect-inbox-width", String(newWidth))
  }

  // Modals state
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [takeoverModalOpen, setTakeoverModalOpen] = useState(false)

  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Subscribe to mock data store updates
  useEffect(() => {
    const unsubscribe = subscribeMockStore(() => {
      setConversations(getStoredConversations())
      setMessages(getStoredMessages())
    })
    return unsubscribe
  }, [])

  // Auto-switch default filter when currentUser role changes
  useEffect(() => {
    if (currentUser.role === "sales") {
      setFilter("mine")
    } else {
      setFilter("all")
    }
  }, [currentUser.username, currentUser.role])

  useEffect(() => {
    localStorage.setItem(
      "lesung-connect-navigation-collapsed",
      String(navigationCollapsed),
    )
  }, [navigationCollapsed])

  useEffect(() => {
    localStorage.setItem(
      "lesung-connect-customer-panel-visible",
      String(customerPanelVisible),
    )
  }, [customerPanelVisible])

  const selected = conversations.find((c) => c.id === selectedId)
  const selectedMessages = useMemo(
    () => (selected ? messages[selected.id] ?? [] : []),
    [messages, selected],
  )

  // Calculate dynamic counts
  const unreadTotal = conversations.reduce(
    (total, conv) => total + conv.unreadCount,
    0,
  )
  const unassignedCount = conversations.filter((c) => c.status === "unassigned").length
  const assignedCount = conversations.filter((c) => c.status === "assigned").length
  const mineCount = conversations.filter((c) => c.assignee === currentUser.name).length
  const allCount = conversations.length

  // Filter conversations
  const visibleConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      let matchesFilter = true
      if (filter === "mine") {
        matchesFilter = conversation.assignee === currentUser.name
      } else if (filter === "unassigned") {
        matchesFilter = conversation.status === "unassigned"
      }

      if (!matchesFilter) return false

      if (search.trim()) {
        const query = search.toLowerCase()
        const matchName = conversation.customer.name.toLowerCase().includes(query)
        const matchPhone = conversation.customer.phone.toLowerCase().includes(query)
        const matchPreview = conversation.preview.toLowerCase().includes(query)
        const matchCompany =
          conversation.customer.company?.toLowerCase().includes(query) ?? false
        return matchName || matchPhone || matchPreview || matchCompany
      }

      return true
    })
  }, [conversations, filter, search, currentUser.name])

  // Scroll to bottom on new messages
  useEffect(() => {
    const container = chatScrollRef.current
    if (!container) return
    const frame = window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [selectedId, selectedMessages.length])

  // Select conversation & mark read
  function handleSelectConversation(conv: Conversation) {
    setSelectedId(conv.id)
    setMobilePanel("chat")
    if (conv.unreadCount > 0) {
      mockMarkConversationRead(conv.id)
    }
  }

  // Permission logic for replying
  const canReply = useMemo(() => {
    if (!selected) return false
    if (selected.status === "unassigned") return false

    // If assigned: Admin can always reply, sales can only reply if assigned to them
    if (currentUser.role === "admin" || currentUser.role === "supervisor") return true
    return selected.assignee === currentUser.name
  }, [selected, currentUser])

  // Actions
  function handleSendMessage(textToSend?: string) {
    const body = (textToSend ?? draft).trim()
    if (!body || !selected || !canReply) return
    mockSendMessage(selected.id, body, currentUser)
    if (!textToSend) setDraft("")
  }

  function handleClaim() {
    if (!selected) return
    mockClaimConversation(selected.id, currentUser)
  }

  function handleRelease() {
    if (!selected) return
    if (confirm("Kembalikan percakapan ini ke antrean unassigned?")) {
      mockReleaseConversation(
        selected.id,
        `Dilepas ke antrean oleh ${currentUser.name}`,
      )
    }
  }

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-muted/20 text-foreground">
      {/* Sidebar Navigation */}
      <aside
        className={`hidden h-full shrink-0 flex-col border-r bg-background px-3 py-5 transition-[width] duration-300 ease-in-out lg:flex ${
          navigationCollapsed ? "w-18" : "w-64"
        }`}
      >
        <Brand
          compact={navigationCollapsed}
          onLogoClick={() => setNavigationCollapsed((c) => !c)}
        />

        <div className="mt-8 space-y-1">
          {!navigationCollapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Menu Utama
            </p>
          )}
          {navigation.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              title={navigationCollapsed ? label : undefined}
              className={`group flex w-full items-center rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                navigationCollapsed ? "justify-center" : "gap-3"
              } ${
                active
                  ? "border-primary/15 bg-primary/10 text-primary shadow-xs"
                  : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-lg transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
              </span>
              {!navigationCollapsed && <span>{label}</span>}
              {label === "Shared Inbox" && unreadTotal > 0 && (
                <span
                  className={`${
                    navigationCollapsed ? "absolute ml-7 -mt-5" : "ml-auto"
                  } rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {unreadTotal}
                </span>
              )}
            </button>
          ))}

          {/* WhatsApp Connection Control (HIDDEN FOR SALES PER CONTRACT) */}
          {currentUser.canControlWhatsApp && (
            <button
              onClick={onOpenConnection}
              title={navigationCollapsed ? "Koneksi WhatsApp" : undefined}
              className={`group flex w-full items-center rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-border hover:bg-muted/70 hover:text-foreground ${
                navigationCollapsed ? "justify-center" : "gap-3"
              }`}
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-background">
                <Wifi className="size-4" />
              </span>
              {!navigationCollapsed && (
                <div className="flex flex-1 items-center justify-between text-left">
                  <span>Koneksi WA</span>
                  <span className="size-2 rounded-full bg-emerald-500" />
                </div>
              )}
            </button>
          )}
        </div>

        {/* Sidebar Footer: Active User & Logout */}
        <div className="mt-auto border-t border-border pt-4">
          {!navigationCollapsed && (
            <div className="mb-3 flex items-center gap-2.5 px-2">
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${currentUser.avatarBg}`}
              >
                {currentUser.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold leading-tight">
                  {currentUser.name}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {currentUser.role.toUpperCase()}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            title={navigationCollapsed ? "Keluar" : undefined}
            className={`flex w-full items-center rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition ${
              navigationCollapsed ? "justify-center" : "gap-2.5"
            }`}
          >
            <LogOut className="size-4 shrink-0" />
            {!navigationCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Top Header Bar */}
        <header className="flex h-18 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobilePanel("list")}
            >
              <Menu />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight">Shared Inbox</h1>
                <span className="hidden rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 sm:inline-flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  WA Ready
                </span>
              </div>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {currentUser.role === "admin" &&
                  "Mode Admin: Kontrol penuh percakapan & antrean sales."}
                {currentUser.role === "supervisor" &&
                  "Mode Supervisor: Pengawasan antrean, takeover & transfer."}
                {currentUser.role === "sales" &&
                  `Mode Sales: Halo ${currentUser.name.split(" ")[0]}, kelola prospek Anda.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Realtime Status Badge */}
            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 md:flex">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Socket.IO (Mock Aktif)
            </div>

            {/* Role Switcher Component */}
            <RoleSwitcher currentUser={currentUser} onSwitchUser={onSwitchUser} />

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-4" />
              {unreadTotal > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
              )}
            </Button>
          </div>
        </header>

        {/* Queue Stats Bar (Especially useful for Admin/Supervisor) */}
        {(currentUser.role === "admin" || currentUser.role === "supervisor") && (
          <div className="grid grid-cols-3 border-b bg-muted/40 text-xs">
            <div className="flex items-center gap-2 border-r px-4 py-2">
              <Clock3 className="size-4 text-amber-500" />
              <span className="text-muted-foreground">Belum Ditangani:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {unassignedCount} chat
              </span>
            </div>
            <div className="flex items-center gap-2 border-r px-4 py-2">
              <UserCheck className="size-4 text-blue-500" />
              <span className="text-muted-foreground">Sedang Ditangani:</span>
              <span className="font-bold text-foreground">
                {assignedCount} chat
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2">
              <MessageSquare className="size-4 text-primary" />
              <span className="text-muted-foreground">Total Percakapan:</span>
              <span className="font-bold text-foreground">{allCount} chat</span>
            </div>
          </div>
        )}

        {/* Content Body: Inbox List + Chat Thread + Customer Panel */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Inbox List Panel */}
          <section
            style={
              isDesktop
                ? {
                    width: `${inboxWidth}px`,
                    minWidth: "260px",
                    maxWidth: "520px",
                  }
                : undefined
            }
            className={`min-h-0 w-full shrink-0 overflow-hidden bg-background ${
              mobilePanel !== "list" ? "hidden md:flex" : "flex"
            } flex-col`}
          >
            {/* Search & Tabs */}
            <div className="border-b px-4 pb-3 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm">Percakapan</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {visibleConversations.length} dari {allCount} chat ditampilkan
                  </p>
                </div>
                <Button
                  size="icon-sm"
                  variant="outline"
                  title="Filter tambahan"
                  onClick={() => setFilter("all")}
                >
                  <Filter className="size-3.5" />
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, nomor, pesan..."
                  className="h-9 w-full rounded-lg border border-input bg-muted/30 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-ring"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Scope & Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setFilter("all")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition ${
                    filter === "all"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Semua ({allCount})
                </button>
                <button
                  onClick={() => setFilter("mine")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition ${
                    filter === "mine"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Chat Saya ({mineCount})
                </button>
                <button
                  onClick={() => setFilter("unassigned")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition ${
                    filter === "unassigned"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Belum Ditangani ({unassignedCount})
                  {unassignedCount > 0 && (
                    <span className="size-1.5 rounded-full bg-amber-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Conversation Items List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {visibleConversations.map((conv) => {
                const isSelected = conv.id === selectedId
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full rounded-xl p-3 text-left transition ${
                      isSelected
                        ? "bg-primary/8 ring-1 ring-primary/20 shadow-xs"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${conv.customer.color}`}
                      >
                        {conv.customer.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {conv.customer.name}
                          </p>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {conv.lastMessageAt}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {conv.preview}
                        </p>

                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          {conv.status === "unassigned" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              Belum Ditangani
                            </span>
                          ) : conv.assignee === currentUser.name ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Ditangani: Anda
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                              <span className="size-1.5 rounded-full bg-blue-500" />
                              Ditangani: {conv.assignee?.split(" ")[0]}
                            </span>
                          )}

                          {conv.unreadCount > 0 && (
                            <span className="ml-auto flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}

              {visibleConversations.length === 0 && (
                <div className="px-4 py-12 text-center text-xs text-muted-foreground">
                  Tidak ada percakapan dalam filter ini.
                </div>
              )}
            </div>
          </section>

          {/* Resizable Divider between Inbox List and Main Chat */}
          <ResizableDivider
            currentWidth={inboxWidth}
            onResize={handleResizeInbox}
            minWidth={260}
            maxWidth={520}
            defaultWidth={340}
          />

          {/* Main Chat Panel */}
          <section
            className={`min-h-0 min-w-0 flex-1 overflow-hidden bg-background ${
              mobilePanel !== "chat" ? "hidden md:flex" : "flex"
            } flex-col`}
          >
            {selected ? (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {/* Chat Top Header */}
                <div className="flex h-18 shrink-0 items-center justify-between border-b px-4 sm:px-6 bg-background">
                  <div className="flex min-w-0 items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="md:hidden"
                      onClick={() => setMobilePanel("list")}
                    >
                      <X className="size-4" />
                    </Button>

                    <button
                      type="button"
                      onClick={() => setCustomerPanelVisible((v) => !v)}
                      className="flex min-w-0 items-center gap-3 rounded-lg p-1 text-left transition hover:bg-muted/60"
                      title="Klik untuk lihat detail customer"
                    >
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${selected.customer.color}`}
                      >
                        {selected.customer.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-sm font-semibold text-foreground">
                            {selected.customer.name}
                          </h2>
                          {selected.status === "unassigned" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              Belum Ditangani
                            </span>
                          ) : selected.assignee === currentUser.name ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Ditangani oleh Anda
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                              <span className="size-1.5 rounded-full bg-blue-500" />
                              Ditangani: {selected.assignee}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {selected.customer.company ?? selected.customer.phone}
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Header Action Buttons (Role-based) */}
                  <div className="flex items-center gap-1.5">
                    {/* Unassigned Claim */}
                    {selected.status === "unassigned" && (
                      <Button
                        size="sm"
                        onClick={handleClaim}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                      >
                        <UserCheck className="size-3.5 mr-1" />
                        Ambil Chat (Claim)
                      </Button>
                    )}

                    {/* Assigned Controls */}
                    {selected.status === "assigned" && (
                      <>
                        {/* Takeover button (Admin / Supervisor only if not already assigned to self) */}
                        {(currentUser.role === "admin" ||
                          currentUser.role === "supervisor") &&
                          selected.assignee !== currentUser.name && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTakeoverModalOpen(true)}
                              className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:border-purple-900 dark:hover:bg-purple-950"
                            >
                              <ShieldAlert className="size-3.5 mr-1" />
                              Takeover
                            </Button>
                          )}

                        {/* Transfer button (Admin can always transfer, sales can transfer if assigned to them) */}
                        {(currentUser.role === "admin" ||
                          currentUser.role === "supervisor" ||
                          selected.assignee === currentUser.name) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTransferModalOpen(true)}
                          >
                            <ArrowRightLeft className="size-3.5 mr-1" />
                            Transfer
                          </Button>
                        )}

                        {/* Release button */}
                        {(currentUser.role === "admin" ||
                          selected.assignee === currentUser.name) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRelease}
                            title="Kembalikan ke antrean unassigned"
                          >
                            Lepas
                          </Button>
                        )}
                      </>
                    )}

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setCustomerPanelVisible((v) => !v)}
                      title="Toggle info customer"
                    >
                      <Users className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Status Notice Banners */}
                {selected.status === "unassigned" && (
                  <div className="flex items-center justify-between border-b bg-amber-500/10 px-4 py-2 text-xs text-amber-800 dark:text-amber-300">
                    <span className="flex items-center gap-2">
                      <Clock3 className="size-3.5" />
                      Chat ini belum memiliki penanggung jawab. Ambil chat untuk mulai membalas pesan.
                    </span>
                    <Button size="xs" onClick={handleClaim}>
                      Ambil Chat
                    </Button>
                  </div>
                )}

                {selected.status === "assigned" &&
                  selected.assignee !== currentUser.name &&
                  currentUser.role === "sales" && (
                    <div className="flex items-center gap-2 border-b bg-blue-500/10 px-4 py-2 text-xs text-blue-800 dark:text-blue-300">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>
                        Chat ini sedang ditangani oleh <strong>{selected.assignee}</strong>. Anda hanya dapat melihat pesan (view-only).
                      </span>
                    </div>
                  )}

                {/* Messages Stream */}
                <div
                  ref={chatScrollRef}
                  className="chat-scroll flex-1 overflow-y-auto bg-muted/10 p-4 sm:p-6"
                >
                  <div className="mx-auto max-w-3xl space-y-4">
                    <div className="my-4 flex items-center gap-3 text-[10px] font-semibold text-muted-foreground">
                      <div className="h-px flex-1 bg-border" />
                      RIWAYAT PESAN WHATSAPP
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    {selectedMessages.map((msg) => {
                      const outgoing = msg.direction === "out"
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2.5 ${
                            outgoing ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!outgoing && (
                            <div
                              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${selected.customer.color}`}
                            >
                              {selected.customer.initials}
                            </div>
                          )}

                          <div
                            className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xs ${
                              outgoing
                                ? "bg-primary text-primary-foreground rounded-br-xs"
                                : "bg-card border border-border text-card-foreground rounded-bl-xs"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 pb-1 text-[10px] opacity-75">
                              <span className="font-semibold">
                                {outgoing ? msg.sentBy ?? "Tim Sales" : selected.customer.name}
                              </span>
                              <span>{msg.createdAt}</span>
                            </div>

                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.body}
                            </p>

                            {outgoing && (
                              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-75">
                                {msg.status === "pending" && (
                                  <Clock className="size-3 animate-spin" />
                                )}
                                {msg.status === "sent" && <Check className="size-3.5" />}
                                {msg.status === "delivered" && (
                                  <CheckCheck className="size-3.5" />
                                )}
                                {msg.status === "read" && (
                                  <CheckCheck className="size-3.5 text-blue-300" />
                                )}
                                <span className="capitalize">{msg.status ?? "terkirim"}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Quick Replies Helper Drawer */}
                {quickRepliesOpen && canReply && (
                  <div className="border-t bg-background px-4 py-2 text-xs">
                    <p className="mb-1.5 font-semibold text-muted-foreground">
                      Template Balasan Cepat:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Halo, terima kasih telah menghubungi kami. Ada yang bisa kami bantu?",
                        "Baik, mohon tunggu sebentar kami koordinasikan dengan tim terkait ya.",
                        "Berikut kami kirimkan ringkasan proposal penawaran resminya.",
                        "Terima kasih atas kepercayaannya bersama LesungConnect!",
                      ].map((tpl) => (
                        <button
                          key={tpl}
                          type="button"
                          onClick={() => {
                            setDraft(tpl)
                            setQuickRepliesOpen(false)
                          }}
                          className="rounded-md border bg-muted/50 px-2.5 py-1 text-left text-xs hover:bg-muted"
                        >
                          {tpl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Composer Input */}
                <div className="border-t bg-background p-3 sm:p-4">
                  <div className="mx-auto max-w-3xl">
                    <div
                      className={`rounded-xl border bg-muted/30 p-2.5 transition focus-within:ring-2 focus-within:ring-ring ${
                        !canReply ? "opacity-60 bg-muted/60" : ""
                      }`}
                    >
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        disabled={!canReply}
                        placeholder={
                          !canReply
                            ? selected.status === "unassigned"
                              ? "Ambil chat terlebih dahulu untuk mulai membalas..."
                              : `Chat ini sedang ditangani oleh ${selected.assignee}. Hanya penanggung jawab aktif yang dapat membalas.`
                            : "Tulis balasan pesan WhatsApp... (Enter untuk kirim)"
                        }
                        rows={2}
                        className="w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                      />

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={!canReply}
                            onClick={() => setQuickRepliesOpen((q) => !q)}
                            title="Template pesan cepat"
                          >
                            <MessageSquare className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={!canReply}
                            title="Lampirkan berkas (dummy)"
                          >
                            <Paperclip className="size-4" />
                          </Button>
                        </div>

                        <Button
                          size="sm"
                          disabled={!draft.trim() || !canReply}
                          onClick={() => handleSendMessage()}
                          className="font-medium"
                        >
                          Kirim Pesan
                          <Send className="size-3.5 ml-1.5" />
                        </Button>
                      </div>
                    </div>

                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      Pesan dikirim melalui WhatsApp resmi perusahaan • Enter kirim, Shift + Enter baris baru
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">
                <div>
                  <MessageCircle className="mx-auto size-12 opacity-30" />
                  <p className="mt-3 font-semibold text-foreground">
                    Pilih percakapan untuk memulai
                  </p>
                  <p className="text-xs">
                    Kelola tiket dan prospek customer secara realtime bersama tim.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Right Customer Info & Audit Panel */}
          {customerPanelVisible && selected && (
            <aside className="hidden w-76 shrink-0 border-l bg-background xl:flex xl:flex-col overflow-y-auto">
              <div className="flex h-18 items-center justify-between border-b px-5">
                <h3 className="font-semibold text-sm">Informasi Customer</h3>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setCustomerPanelVisible(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="flex-1 p-5 space-y-5">
                {/* Profile Card */}
                <div className="flex flex-col items-center border-b pb-5 text-center">
                  <div
                    className={`flex size-14 items-center justify-center rounded-2xl text-base font-bold shadow-xs ${selected.customer.color}`}
                  >
                    {selected.customer.initials}
                  </div>
                  <h4 className="mt-3 font-semibold text-foreground">
                    {selected.customer.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {selected.customer.company ?? "Perusahaan belum diatur"}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    +{selected.customer.phone.replace(/@c\.us$/, "")}
                  </p>
                </div>

                {/* Penanggung Jawab Chat (Assignee Card) */}
                <div className="rounded-xl border bg-muted/30 p-3.5">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Penanggung Jawab Chat
                    </span>
                    {selected.status === "assigned" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                        <span className="size-1.5 rounded-full bg-amber-500" />
                        Antrean
                      </span>
                    )}
                  </div>

                  {selected.status === "assigned" ? (
                    <div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                          {selected.assignee
                            ?.split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {selected.assignee}
                            {selected.assignee === currentUser.name && " (Anda)"}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground uppercase">
                            {selected.assigneeRole ?? "Sales Tim"}
                          </p>
                        </div>
                      </div>

                      {/* Quick action buttons for chat management */}
                      {(currentUser.role === "admin" ||
                        currentUser.role === "supervisor" ||
                        selected.assignee === currentUser.name) && (
                        <div className="mt-3 flex items-center gap-2 border-t pt-2.5">
                          <Button
                            variant="outline"
                            size="xs"
                            className="flex-1 text-xs"
                            onClick={() => setTransferModalOpen(true)}
                          >
                            <ArrowRightLeft className="size-3 mr-1" />
                            Transfer
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-xs text-muted-foreground hover:text-destructive"
                            onClick={handleRelease}
                            title="Lepas kembali ke antrean"
                          >
                            Lepas
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-muted-foreground">
                        Belum ada yang menangani chat ini.
                      </p>
                      <Button
                        size="sm"
                        onClick={handleClaim}
                        className="mt-2.5 w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs"
                      >
                        <UserCheck className="size-3.5 mr-1" />
                        Ambil Chat Sekarang
                      </Button>
                    </div>
                  )}
                </div>

                {/* Contact Metadata */}
                <div className="space-y-3 text-xs border-t pt-4">
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium text-foreground">
                      {selected.customer.email ?? "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Alamat:</span>
                    <p className="font-medium text-foreground">
                      {selected.customer.address ?? "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tags:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selected.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Assignment Audit History */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    <History className="size-3.5" />
                    Riwayat Penugasan (Audit)
                  </div>
                  <div className="space-y-2">
                    {selected.assignments && selected.assignments.length > 0 ? (
                      selected.assignments.map((asg, idx) => (
                        <div
                          key={asg.id ?? idx}
                          className="rounded-lg border bg-muted/30 p-2 text-xs"
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span>{asg.user.name}</span>
                            <span className="text-[10px] font-normal text-muted-foreground">
                              {asg.endedAt ? "Selesai" : "Aktif"}
                            </span>
                          </div>
                          {asg.endReason && (
                            <p className="mt-1 text-[10px] text-muted-foreground italic">
                              "{asg.endReason}"
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Belum ada riwayat penugasan.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* Action Modals */}
      {transferModalOpen && selected && (
        <TransferModal
          conversation={selected}
          currentUser={currentUser}
          onClose={() => setTransferModalOpen(false)}
          onConfirm={(targetUserId, note) => {
            mockTransferConversation(selected.id, targetUserId, note, currentUser)
          }}
        />
      )}

      {takeoverModalOpen && selected && (
        <TakeoverModal
          conversation={selected}
          currentUser={currentUser}
          onClose={() => setTakeoverModalOpen(false)}
          onConfirm={(reason) => {
            mockTakeoverConversation(selected.id, reason, currentUser)
          }}
        />
      )}
    </div>
  )
}

function Brand({
  compact,
  onLogoClick,
}: {
  compact: boolean
  onLogoClick: () => void
}) {
  return (
    <div className={`flex items-center gap-2 ${compact ? "justify-center" : "px-2"}`}>
      <button
        type="button"
        onClick={onLogoClick}
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition hover:scale-105"
        aria-label={compact ? "Perbesar navigasi" : "Perkecil navigasi"}
        title={compact ? "Perbesar navigasi" : "Perkecil navigasi"}
      >
        <MessageCircle className="size-5" />
      </button>
      {!compact && (
        <div>
          <p className="font-bold tracking-tight text-sm leading-none">
            Lesung<span className="text-primary">Connect</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">SHARED INBOX</p>
        </div>
      )}
    </div>
  )
}

function App() {
  const [username, setUsername] = useState<string | null>(() => {
    return localStorage.getItem("lesung-connect-user") || "admin.test"
  })
  const [page, setPage] = useState<"inbox" | "whatsapp">("inbox")

  const currentUser: User =
    (username && DUMMY_USERS[username]) || DUMMY_USERS["admin.test"]

  async function login(nextUsername: string) {
    localStorage.setItem("lesung-connect-user", nextUsername)
    setUsername(nextUsername)
  }

  function handleSwitchUser(nextUsername: string) {
    localStorage.setItem("lesung-connect-user", nextUsername)
    setUsername(nextUsername)
  }

  function logout() {
    localStorage.removeItem("lesung-connect-user")
    setUsername(null)
    setPage("inbox")
  }

  if (!username) {
    return <LoginPage onLogin={login} />
  }

  if (page === "whatsapp") {
    // Contract rule: If user is not admin/supervisor, prevent accessing WhatsApp Connection
    if (!currentUser.canControlWhatsApp) {
      setPage("inbox")
      return null
    }
    return <WhatsAppConnectionPage onBack={() => setPage("inbox")} />
  }

  return (
    <Dashboard
      currentUser={currentUser}
      onSwitchUser={handleSwitchUser}
      onOpenConnection={() => setPage("whatsapp")}
      onLogout={logout}
    />
  )
}

export default App

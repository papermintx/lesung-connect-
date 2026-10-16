import type {
  Assignment,
  Conversation,
  Message,
  ProspectStatus,
  QueueStats,
  User,
} from "@/types/inbox"
import type { WhatsAppStatus } from "@/types/whatsapp"

export const DUMMY_USERS: Record<string, User> = {
  "admin.test": {
    id: "usr-admin-1",
    username: "admin.test",
    name: "Budi Santoso",
    role: "admin",
    title: "Head of Operations & CS",
    email: "budi.santoso@lesungconnect.com",
    initials: "BS",
    avatarBg: "bg-emerald-600 text-white",
    canControlWhatsApp: true,
  },
  "supervisor.maya": {
    id: "usr-spv-1",
    username: "supervisor.maya",
    name: "Maya Anggraini",
    role: "supervisor",
    title: "Support Supervisor",
    email: "maya.anggraini@lesungconnect.com",
    initials: "MA",
    avatarBg: "bg-purple-600 text-white",
    canControlWhatsApp: true,
  },
  "sales.rina": {
    id: "usr-sales-1",
    username: "sales.rina",
    name: "Rina Pratama",
    role: "sales",
    title: "Senior Account Executive",
    email: "rina.pratama@lesungconnect.com",
    initials: "RP",
    avatarBg: "bg-blue-600 text-white",
    canControlWhatsApp: false,
  },
  "sales.dimas": {
    id: "usr-sales-2",
    username: "sales.dimas",
    name: "Dimas Setiawan",
    role: "sales",
    title: "Sales Representative",
    email: "dimas.setiawan@lesungconnect.com",
    initials: "DS",
    avatarBg: "bg-amber-600 text-white",
    canControlWhatsApp: false,
  },
}

export const DUMMY_SALES_LIST = Object.values(DUMMY_USERS).filter(
  (user) => user.role === "sales",
)

export const DEFAULT_WHATSAPP_STATUS: WhatsAppStatus = {
  state: "ready",
  phoneNumber: "6281288991234",
  connectedAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
}

const now = Date.now()
const minsAgo = (mins: number) => new Date(now - mins * 60 * 1000).toISOString()
const hoursAgo = (hours: number) => new Date(now - hours * 3600 * 1000).toISOString()

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-101",
    customerId: "cust-1",
    customer: {
      id: "cust-1",
      name: "Hendra Wijaya",
      phone: "6281234567890@c.us",
      waNumber: "6281234567890@c.us",
      initials: "HW",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      company: "PT Maju Jaya Logistik",
      email: "hendra@majujaya.co.id",
      address: "Jl. Gatot Subroto No. 45, Jakarta Selatan",
    },
    preview: "Kira-kira paket enterprise apa yang sesuai ya untuk 10 agent?",
    lastMessageAt: "13:42",
    unreadCount: 2,
    status: "unassigned",
    waitingSince: minsAgo(8),
    tags: ["Enterprise", "10 Agents"],
    assignments: [],
  },
  {
    id: "conv-102",
    customerId: "cust-2",
    customer: {
      id: "cust-2",
      name: "Sari Wulandari",
      phone: "6281987654321@c.us",
      waNumber: "6281987654321@c.us",
      initials: "SW",
      color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      company: "CV Kreasi Digital Nusantara",
      email: "sari@kreasidigital.id",
      address: "Jl. Ir. H. Juanda No. 88, Bandung",
    },
    preview: "Siang, saya mau tanya apakah sistem ini bisa integrasi dengan katalog produk kami?",
    lastMessageAt: "13:48",
    unreadCount: 1,
    status: "unassigned",
    waitingSince: minsAgo(2),
    tags: ["Inquiry", "Integrasi"],
    assignments: [],
  },
  {
    id: "conv-103",
    customerId: "cust-3",
    customer: {
      id: "cust-3",
      name: "Kevin Tanaka",
      phone: "6282112345678@c.us",
      waNumber: "6282112345678@c.us",
      initials: "KT",
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      company: "PT Teknologi Nusantara Raya",
      email: "kevin.tanaka@teknus.com",
      address: "Sudirman Central Business District (SCBD) Lot 11, Jakarta",
    },
    preview: "Ada beberapa poin mengenai SLA uptime dan migrasi kontak yang ingin kami diskusikan...",
    lastMessageAt: "13:20",
    unreadCount: 1,
    status: "assigned",
    assignee: "Rina Pratama",
    assigneeId: "usr-sales-1",
    assigneeRole: "sales",
    tags: ["High Value", "Proposal", "SLA"],
    assignments: [
      {
        id: "asg-301",
        conversationId: "conv-103",
        userId: "usr-sales-1",
        assignedAt: hoursAgo(2),
        endedAt: null,
        endReason: null,
        user: { id: "usr-sales-1", name: "Rina Pratama", role: "sales" },
      },
    ],
  },
  {
    id: "conv-104",
    customerId: "cust-4",
    customer: {
      id: "cust-4",
      name: "dr. Amelia Chandra",
      phone: "6285678901234@c.us",
      waNumber: "6285678901234@c.us",
      initials: "AC",
      color: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
      company: "Klinik Pratama Sehat Mandiri",
      email: "amelia@kliniksehat.org",
      address: "Jl. Diponegoro No. 12, Surabaya",
    },
    preview: "Terima kasih banyak dr. Amelia. Jika bukti potong pajak sudah ada...",
    lastMessageAt: "11:15",
    unreadCount: 0,
    status: "assigned",
    assignee: "Rina Pratama",
    assigneeId: "usr-sales-1",
    assigneeRole: "sales",
    tags: ["Klinik", "Tax Invoice"],
    assignments: [
      {
        id: "asg-401",
        conversationId: "conv-104",
        userId: "usr-sales-1",
        assignedAt: hoursAgo(5),
        endedAt: null,
        endReason: null,
        user: { id: "usr-sales-1", name: "Rina Pratama", role: "sales" },
      },
    ],
  },
  {
    id: "conv-105",
    customerId: "cust-5",
    customer: {
      id: "cust-5",
      name: "Fajar Nugroho",
      phone: "6287711223344@c.us",
      waNumber: "6287711223344@c.us",
      initials: "FN",
      color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      company: "PT Berkah Distributor Mandiri",
      email: "fajar@berkahdist.co.id",
      address: "Kawasan Industri MM2100, Cikarang",
    },
    preview: "Bisa Pak Fajar! LesungConnect tersambung via WhatsApp Multi-Device resmi...",
    lastMessageAt: "10:05",
    unreadCount: 0,
    status: "assigned",
    assignee: "Dimas Setiawan",
    assigneeId: "usr-sales-2",
    assigneeRole: "sales",
    tags: ["Technical Q&A"],
    assignments: [
      {
        id: "asg-501",
        conversationId: "conv-105",
        userId: "usr-sales-2",
        assignedAt: hoursAgo(6),
        endedAt: null,
        endReason: null,
        user: { id: "usr-sales-2", name: "Dimas Setiawan", role: "sales" },
      },
    ],
  },
  {
    id: "conv-106",
    customerId: "cust-6",
    customer: {
      id: "cust-6",
      name: "Ratna Dewi",
      phone: "6281399887766@c.us",
      waNumber: "6281399887766@c.us",
      initials: "RD",
      color: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
      company: "Boutique Chic & Glam",
      email: "ratna@boutiquechic.com",
      address: "Mall Taman Anggrek Lt. 2, Jakarta Barat",
    },
    preview: "Terima kasih banyak atas bantuannya, setup multi nomor sudah berjalan lancar...",
    lastMessageAt: "Kemarin",
    unreadCount: 0,
    status: "assigned",
    assignee: "Dimas Setiawan",
    assigneeId: "usr-sales-2",
    assigneeRole: "sales",
    tags: ["Retail", "Multi Device"],
    assignments: [
      {
        id: "asg-601",
        conversationId: "conv-106",
        userId: "usr-sales-2",
        assignedAt: hoursAgo(24),
        endedAt: null,
        endReason: null,
        user: { id: "usr-sales-2", name: "Dimas Setiawan", role: "sales" },
      },
    ],
  },
]

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  "conv-101": [
    {
      id: "msg-101-1",
      conversationId: "conv-101",
      direction: "in",
      type: "text",
      body: "Halo selamat siang LesungConnect, apakah kami bisa konsultasi mengenai implementasi shared WhatsApp untuk 10 agent sales kami?",
      source: "customer",
      status: "read",
      createdAt: "13:40",
    },
    {
      id: "msg-101-2",
      conversationId: "conv-101",
      direction: "in",
      type: "text",
      body: "Kira-kira paket enterprise apa yang sesuai ya untuk 10 agent?",
      source: "customer",
      status: "delivered",
      createdAt: "13:42",
    },
  ],
  "conv-102": [
    {
      id: "msg-102-1",
      conversationId: "conv-102",
      direction: "in",
      type: "text",
      body: "Siang, saya mau tanya apakah sistem ini bisa integrasi dengan katalog produk kami di web?",
      source: "customer",
      status: "delivered",
      createdAt: "13:48",
    },
  ],
  "conv-103": [
    {
      id: "msg-103-1",
      conversationId: "conv-103",
      direction: "in",
      type: "text",
      body: "Selamat pagi Bu Rina, draft proposal kemarin sudah kami review bersama tim manajemen.",
      source: "customer",
      status: "read",
      createdAt: "10:30",
    },
    {
      id: "msg-103-2",
      conversationId: "conv-103",
      direction: "out",
      type: "text",
      body: "Selamat pagi Pak Kevin! Terima kasih atas update-nya. Bagaimana tanggapan tim manajemen mengenai paket 5 user yang kami tawarkan?",
      source: "web",
      status: "read",
      sentBy: "Rina Pratama",
      sentById: "usr-sales-1",
      createdAt: "10:45",
    },
    {
      id: "msg-103-3",
      conversationId: "conv-103",
      direction: "in",
      type: "text",
      body: "Secara umum setuju Bu. Namun ada beberapa poin mengenai SLA uptime dan migrasi kontak yang ingin kami diskusikan lebih lanjut sore ini via Google Meet. Apakah Bu Rina ada waktu jam 15.30?",
      source: "customer",
      status: "delivered",
      createdAt: "13:20",
    },
  ],
  "conv-104": [
    {
      id: "msg-104-1",
      conversationId: "conv-104",
      direction: "in",
      type: "text",
      body: "Halo Bu Rina, invoice berlangganan untuk Klinik Pratama Sehat Mandiri sudah kami terima dan sedang diproses oleh finance kami.",
      source: "customer",
      status: "read",
      createdAt: "11:00",
    },
    {
      id: "msg-104-2",
      conversationId: "conv-104",
      direction: "out",
      type: "text",
      body: "Terima kasih banyak dr. Amelia. Jika bukti potong pajak sudah ada, bisa sekalian dikirimkan ke sini juga ya dok.",
      source: "web",
      status: "read",
      sentBy: "Rina Pratama",
      sentById: "usr-sales-1",
      createdAt: "11:15",
    },
  ],
  "conv-105": [
    {
      id: "msg-105-1",
      conversationId: "conv-105",
      direction: "in",
      type: "text",
      body: "Mas Dimas, apakah WhatsApp Web di sistem LesungConnect ini bisa tetap aktif di HP kantor tanpa sering disconnect?",
      source: "customer",
      status: "read",
      createdAt: "09:50",
    },
    {
      id: "msg-105-2",
      conversationId: "conv-105",
      direction: "out",
      type: "text",
      body: "Bisa Pak Fajar! LesungConnect tersambung via WhatsApp Multi-Device resmi, sehingga HP utama tetap bisa digunakan normal tanpa terputus dan sesi di server tersimpan stabil.",
      source: "web",
      status: "read",
      sentBy: "Dimas Setiawan",
      sentById: "usr-sales-2",
      createdAt: "10:05",
    },
  ],
  "conv-106": [
    {
      id: "msg-106-1",
      conversationId: "conv-106",
      direction: "in",
      type: "text",
      body: "Terima kasih banyak atas bantuannya Bu Rina, implementasi WhatsApp Shared Inbox untuk 3 toko cabang kami sudah live dan tim kasir senang sekali.",
      source: "customer",
      status: "read",
      createdAt: "Kemarin 16:30",
    },
    {
      id: "msg-106-2",
      conversationId: "conv-106",
      direction: "out",
      type: "text",
      body: "Sama-sama Ibu Ratna! Sukses selalu untuk usahanya. Jangan ragu hubungi kami jika butuh bantuan lebih lanjut ya.",
      source: "web",
      status: "read",
      sentBy: "Rina Pratama",
      sentById: "usr-sales-1",
      createdAt: "Kemarin 16:45",
    },
  ],
}

// STORAGE KEY
const STORAGE_KEY_CONVERSATIONS = "lesung_mock_conversations_v5"
const STORAGE_KEY_MESSAGES = "lesung_mock_messages_v5"
const STORAGE_KEY_WHATSAPP = "lesung_mock_whatsapp_v2"

// LISTENERS FOR REACTIVITY
type Listener = () => void
const listeners = new Set<Listener>()

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener()
    } catch (e) {
      console.error(e)
    }
  })
}

export function subscribeMockStore(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// STORE GETTERS & SETTERS
export function getStoredConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS)
    if (raw) return JSON.parse(raw) as Conversation[]
  } catch {
    // fallback
  }
  return INITIAL_CONVERSATIONS
}

export function setStoredConversations(conversations: Conversation[]) {
  localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations))
  notifyListeners()
}

export function getStoredMessages(): Record<string, Message[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES)
    if (raw) return JSON.parse(raw) as Record<string, Message[]>
  } catch {
    // fallback
  }
  return INITIAL_MESSAGES
}

export function setStoredMessages(messages: Record<string, Message[]>) {
  localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages))
  notifyListeners()
}

export function getStoredWhatsAppStatus(): WhatsAppStatus {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WHATSAPP)
    if (raw) return JSON.parse(raw) as WhatsAppStatus
  } catch {
    // fallback
  }
  return DEFAULT_WHATSAPP_STATUS
}

export function setStoredWhatsAppStatus(status: WhatsAppStatus) {
  localStorage.setItem(STORAGE_KEY_WHATSAPP, JSON.stringify(status))
  notifyListeners()
}

export function resetMockDataToDefault() {
  localStorage.removeItem(STORAGE_KEY_CONVERSATIONS)
  localStorage.removeItem(STORAGE_KEY_MESSAGES)
  localStorage.removeItem(STORAGE_KEY_WHATSAPP)
  notifyListeners()
}

// MOCK ACTIONS CONFORMING TO CONTRACT
export function mockGetConversations(
  scope: "all" | "mine" | "queue",
  filter: string,
  search: string,
  currentUser: User,
): Conversation[] {
  const conversations = getStoredConversations()

  return conversations.filter((conv) => {
    // Scope filtering
    if (scope === "mine") {
      if (conv.assignee !== currentUser.name) return false
    } else if (scope === "queue") {
      if (conv.status !== "unassigned") return false
    }

    // Status filter
    if (filter === "mine") {
      if (conv.assignee !== currentUser.name) return false
    } else if (filter === "unassigned") {
      if (conv.status !== "unassigned") return false
    } else if (filter === "resolved") {
      if (conv.status !== "resolved") return false
    } else if (filter === "assigned") {
      if (conv.status !== "assigned") return false
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchName = conv.customer.name.toLowerCase().includes(q)
      const matchPhone = conv.customer.phone.toLowerCase().includes(q)
      const matchCompany = conv.customer.company?.toLowerCase().includes(q) ?? false
      const matchPreview = conv.preview.toLowerCase().includes(q)
      if (!matchName && !matchPhone && !matchCompany && !matchPreview) return false
    }

    return true
  })
}

export function mockGetQueueStats(): QueueStats {
  const conversations = getStoredConversations()
  const unassigned = conversations.filter((c) => c.status === "unassigned").length
  const assigned = conversations.filter((c) => c.status === "assigned").length
  return {
    unassigned,
    assigned,
    oldestWaitingSeconds: unassigned > 0 ? 480 : 0, // 8 mins
  }
}

export function mockSendMessage(
  conversationId: string,
  body: string,
  currentUser: User,
  replyToId?: string | null,
): Message {
  const allMessages = getStoredMessages()
  const currentList = allMessages[conversationId] ?? []

  const newMessage: Message = {
    id: `msg-${Date.now()}`,
    conversationId,
    direction: "out",
    type: "text",
    body,
    source: "web",
    status: "pending",
    sentBy: currentUser.name,
    sentById: currentUser.id,
    replyToId: replyToId ?? null,
    createdAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
  }

  // Save pending
  const updatedMessages = {
    ...allMessages,
    [conversationId]: [...currentList, newMessage],
  }
  setStoredMessages(updatedMessages)

  // Update conversation preview and time
  const allConversations = getStoredConversations()
  const updatedConversations = allConversations.map((c) => {
    if (c.id === conversationId) {
      return {
        ...c,
        preview: body,
        lastMessageAt: newMessage.createdAt,
      }
    }
    return c
  })
  setStoredConversations(updatedConversations)

  // Simulate delivery progression: pending -> sent (300ms) -> delivered (800ms) -> read (1600ms)
  setTimeout(() => {
    const list = getStoredMessages()
    const msgs = list[conversationId] ?? []
    setStoredMessages({
      ...list,
      [conversationId]: msgs.map((m) => (m.id === newMessage.id ? { ...m, status: "sent" } : m)),
    })
  }, 300)

  setTimeout(() => {
    const list = getStoredMessages()
    const msgs = list[conversationId] ?? []
    setStoredMessages({
      ...list,
      [conversationId]: msgs.map((m) =>
        m.id === newMessage.id ? { ...m, status: "delivered" } : m,
      ),
    })
  }, 800)

  setTimeout(() => {
    const list = getStoredMessages()
    const msgs = list[conversationId] ?? []
    setStoredMessages({
      ...list,
      [conversationId]: msgs.map((m) => (m.id === newMessage.id ? { ...m, status: "read" } : m)),
    })
  }, 1600)

  return newMessage
}

export function mockClaimConversation(conversationId: string, currentUser: User) {
  const conversations = getStoredConversations()
  const updated = conversations.map((conv) => {
    if (conv.id === conversationId) {
      const assignment: Assignment = {
        id: `asg-${Date.now()}`,
        conversationId,
        userId: currentUser.id,
        assignedAt: new Date().toISOString(),
        endedAt: null,
        endReason: null,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        },
      }
      return {
        ...conv,
        status: "assigned" as const,
        assignee: currentUser.name,
        assigneeId: currentUser.id,
        assigneeRole: currentUser.role,
        waitingSince: undefined,
        assignments: [assignment, ...conv.assignments],
      }
    }
    return conv
  })
  setStoredConversations(updated)
}

export function mockTransferConversation(
  conversationId: string,
  targetUserId: string | null,
  note: string,
  currentUser: User,
) {
  const conversations = getStoredConversations()
  const targetUser = targetUserId ? Object.values(DUMMY_USERS).find((u) => u.id === targetUserId) : null

  const updated = conversations.map((conv) => {
    if (conv.id === conversationId) {
      // End current active assignments
      const endedAssignments = conv.assignments.map((a) =>
        a.endedAt === null
          ? {
              ...a,
              endedAt: new Date().toISOString(),
              endReason: note || `Ditransfer oleh ${currentUser.name}`,
            }
          : a,
      )

      if (targetUser) {
        // Transfer to another sales/user
        const newAssignment: Assignment = {
          id: `asg-${Date.now()}`,
          conversationId,
          userId: targetUser.id,
          assignedAt: new Date().toISOString(),
          endedAt: null,
          endReason: null,
          user: {
            id: targetUser.id,
            name: targetUser.name,
            role: targetUser.role,
          },
        }
        return {
          ...conv,
          status: "assigned" as const,
          assignee: targetUser.name,
          assigneeId: targetUser.id,
          assigneeRole: targetUser.role,
          assignments: [newAssignment, ...endedAssignments],
        }
      } else {
        // Return to queue (unassigned)
        return {
          ...conv,
          status: "unassigned" as const,
          assignee: undefined,
          assigneeId: undefined,
          assigneeRole: undefined,
          waitingSince: new Date().toISOString(),
          assignments: endedAssignments,
        }
      }
    }
    return conv
  })
  setStoredConversations(updated)
}

export function mockTakeoverConversation(
  conversationId: string,
  reason: string,
  currentUser: User,
) {
  const conversations = getStoredConversations()
  const updated = conversations.map((conv) => {
    if (conv.id === conversationId) {
      const endedAssignments = conv.assignments.map((a) =>
        a.endedAt === null
          ? {
              ...a,
              endedAt: new Date().toISOString(),
              endReason: reason || `Diambil alih (Takeover) oleh supervisor ${currentUser.name}`,
            }
          : a,
      )

      const newAssignment: Assignment = {
        id: `asg-${Date.now()}`,
        conversationId,
        userId: currentUser.id,
        assignedAt: new Date().toISOString(),
        endedAt: null,
        endReason: null,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        },
      }

      return {
        ...conv,
        status: "assigned" as const,
        assignee: currentUser.name,
        assigneeId: currentUser.id,
        assigneeRole: currentUser.role,
        assignments: [newAssignment, ...endedAssignments],
      }
    }
    return conv
  })
  setStoredConversations(updated)
}

export function mockReleaseConversation(conversationId: string, reason: string) {
  const conversations = getStoredConversations()
  const updated = conversations.map((conv) => {
    if (conv.id === conversationId) {
      const endedAssignments = conv.assignments.map((a) =>
        a.endedAt === null
          ? {
              ...a,
              endedAt: new Date().toISOString(),
              endReason: reason || "Dilepas ke antrean (Release)",
            }
          : a,
      )
      return {
        ...conv,
        status: "unassigned" as const,
        assignee: undefined,
        assigneeId: undefined,
        assigneeRole: undefined,
        waitingSince: new Date().toISOString(),
        assignments: endedAssignments,
      }
    }
    return conv
  })
  setStoredConversations(updated)
}

export function mockResolveConversation(
  conversationId: string,
  note: string,
  prospectStatus: ProspectStatus | undefined,
  currentUser: User,
) {
  const conversations = getStoredConversations()
  const updated = conversations.map((conv) => {
    if (conv.id === conversationId) {
      const endedAssignments = conv.assignments.map((a) =>
        a.endedAt === null
          ? {
              ...a,
              endedAt: new Date().toISOString(),
              endReason: note || "Selesai (Resolved)",
            }
          : a,
      )
      return {
        ...conv,
        status: "resolved" as const,
        resolvedAt: new Date().toISOString(),
        resolvedById: currentUser.id,
        customer: {
          ...conv.customer,
          prospectStatus: prospectStatus ?? conv.customer.prospectStatus,
        },
        assignments: endedAssignments,
      }
    }
    return conv
  })
  setStoredConversations(updated)
}

export function mockReopenConversation(conversationId: string, currentUser: User) {
  const conversations = getStoredConversations()
  const updated = conversations.map((conv) => {
    if (conv.id === conversationId) {
      return {
        ...conv,
        status: "unassigned" as const,
        assignee: undefined,
        assigneeId: undefined,
        assigneeRole: undefined,
        resolvedAt: null,
        resolvedById: null,
        waitingSince: new Date().toISOString(),
        assignments: [
          {
            id: `asg-${Date.now()}`,
            conversationId,
            userId: currentUser.id,
            assignedAt: new Date().toISOString(),
            endedAt: new Date().toISOString(),
            endReason: `Reopened oleh ${currentUser.name}`,
            user: {
              id: currentUser.id,
              name: currentUser.name,
              role: currentUser.role,
            },
          },
          ...conv.assignments,
        ],
      }
    }
    return conv
  })
  setStoredConversations(updated)
}

export function mockMarkConversationRead(conversationId: string) {
  const conversations = getStoredConversations()
  const updated = conversations.map((conv) => {
    if (conv.id === conversationId && conv.unreadCount > 0) {
      return { ...conv, unreadCount: 0 }
    }
    return conv
  })
  setStoredConversations(updated)
}

export function mockUpdateCustomer(
  conversationId: string,
  updates: Partial<Conversation["customer"]>,
) {
  const conversations = getStoredConversations()
  const updated = conversations.map((conv) => {
    if (conv.id === conversationId) {
      return {
        ...conv,
        customer: {
          ...conv.customer,
          ...updates,
        },
      }
    }
    return conv
  })
  setStoredConversations(updated)
}

export type UserRole = "admin" | "supervisor" | "sales"

export type User = {
  id: string
  username: string
  name: string
  role: UserRole
  title: string
  email: string
  initials: string
  avatarBg: string
  canControlWhatsApp: boolean
}

export type ConversationStatus = "unassigned" | "assigned" | "resolved"

export type ProspectStatus = "new" | "follow_up" | "negotiation" | "won" | "lost"

export type Assignment = {
  id: string
  conversationId: string
  userId: string
  assignedAt: string
  endedAt: string | null
  endReason: string | null
  user: {
    id: string
    name: string
    role?: UserRole
  }
}

export type Customer = {
  id?: string
  name: string
  phone: string
  waNumber?: string
  initials: string
  color: string
  company?: string
  email?: string | null
  address?: string | null
  prospectStatus?: ProspectStatus
}

export type Conversation = {
  id: string
  customerId?: string
  customer: Customer
  preview: string
  lastMessageAt: string
  unreadCount: number
  status: ConversationStatus
  assignee?: string
  assigneeId?: string
  assigneeRole?: UserRole
  waitingSince?: string
  resolvedAt?: string | null
  resolvedById?: string | null
  tags: string[]
  assignments: Assignment[]
  canReply?: boolean
}

export type Message = {
  id: string
  conversationId?: string
  direction: "in" | "out"
  type: "text" | "image"
  body: string
  mediaUrl?: string | null
  status?: "pending" | "sent" | "delivered" | "read" | "failed"
  source?: "customer" | "web" | "phone"
  createdAt: string
  sentById?: string | null
  sentBy?: string
  replyToId?: string | null
}

export type QueueStats = {
  unassigned: number
  assigned: number
  oldestWaitingSeconds: number
}

export type BackendConversation = {
  id: string
  customer: {
    id: string
    name: string
    waNumber: string
    company: string | null
    email?: string | null
    address?: string | null
    prospectStatus?: ProspectStatus
  }
  status: ConversationStatus
  unreadCount: number
  lastMessageAt: string | null
  waitingSince: string | null
  assignments: Array<{
    id?: string
    conversationId?: string
    userId?: string
    assignedAt?: string
    user: { id: string; name: string; role?: UserRole }
    endedAt: string | null
    endReason?: string | null
  }>
}

export type BackendMessage = {
  id: string
  conversationId: string
  direction: "in" | "out"
  type: "text" | "image"
  body: string
  mediaUrl: string | null
  status: "pending" | "sent" | "delivered" | "read" | "failed"
  createdAt: string
  sentBy: { id: string; name: string } | null
  replyToId: string | null
}

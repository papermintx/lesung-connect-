import type {
  BackendConversation,
  BackendMessage,
  Conversation,
  Message,
} from "@/types/inbox"
import { logError, logRequest, logResponse } from "@/lib/logger"

const API_BASE_URL = "http://localhost:3000/api/v1"

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

let refreshPromise: Promise<void> | null = null

function clearSession() {
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("lesung-connect-user")
  window.dispatchEvent(new Event("lesung-connect:session-expired"))
}

export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise

  const refreshToken = localStorage.getItem("refreshToken")
  if (!refreshToken) {
    clearSession()
    throw new ApiError("Sesi login sudah berakhir. Silakan login kembali.", 401, "UNAUTHORIZED")
  }

  refreshPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    const payload = await response.json()
    if (!response.ok || payload.success === false) {
      clearSession()
      throw new ApiError(payload.error?.message ?? "Refresh session gagal.", response.status, payload.error?.code)
    }
    localStorage.setItem("accessToken", payload.data.accessToken)
    localStorage.setItem("refreshToken", payload.data.refreshToken)
    window.dispatchEvent(new Event("lesung-connect:token-refreshed"))
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

export async function apiRequest<T>(path: string, options?: RequestInit, retry = true): Promise<T> {
  const token = localStorage.getItem("accessToken")
  const url = `${API_BASE_URL}${path}`
  const startedAt = performance.now()
  logRequest("REST", `${options?.method ?? "GET"} ${url}`, options?.body)

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      ...options,
    })

    const payload = await response.json()
    if (!response.ok || payload.success === false) {
      const requestError = new ApiError(
        payload.error?.message ?? `HTTP ${response.status}`,
        response.status,
        payload.error?.code,
      )
      if (response.status === 401 && retry && path !== "/auth/refresh" && localStorage.getItem("refreshToken")) {
        await refreshAccessToken()
        return apiRequest<T>(path, options, false)
      }
      throw requestError
    }
    logResponse("REST", `${options?.method ?? "GET"} ${url}`, performance.now() - startedAt, payload)
    return payload.data as T
  } catch (requestError) {
    logError("REST", `${options?.method ?? "GET"} ${url}`, performance.now() - startedAt, requestError)
    throw requestError
  }
}

export { API_BASE_URL }

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()
}

export function normalizeConversation(item: BackendConversation): Conversation {
  const assignment = item.assignments.find((value) => value.endedAt === null)
  return {
    id: item.id,
    customer: {
      name: item.customer.name,
      phone: item.customer.waNumber,
      initials: initials(item.customer.name),
      color: "bg-primary/10 text-primary",
      company: item.customer.company ?? undefined,
    },
    preview: "",
    lastMessageAt: item.lastMessageAt
      ? new Date(item.lastMessageAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      : "-",
    unreadCount: item.unreadCount,
    status: item.status,
    assignee: assignment?.user.name,
    waitingSince: item.waitingSince ? new Date(item.waitingSince).toLocaleString("id-ID") : undefined,
    tags: [],
    assignments: [],
  }
}

export function normalizeMessage(item: BackendMessage): Message {
  return {
    id: item.id,
    conversationId: item.conversationId,
    direction: item.direction,
    type: item.type,
    body: item.body,
    mediaUrl: item.mediaUrl,
    status: item.status,
    createdAt: new Date(item.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    sentBy: item.sentBy?.name,
    replyToId: item.replyToId,
  }
}

export function getConversations() {
  return apiRequest<{ items: BackendConversation[]; meta: { total: number } }>("/conversations?scope=mine")
}

export function loginRequest(username: string, password: string) {
  return apiRequest<{
    accessToken: string
    refreshToken: string
    user: { id: string; username: string; name?: string; role: string }
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })
}

export function logoutRequest() {
  return apiRequest<null>("/auth/logout", { method: "POST" })
}

export function getConversationMessages(conversationId: string) {
  return apiRequest<BackendMessage[]>(`/conversations/${conversationId}/messages?limit=30`)
}

export function claimConversation(conversationId: string) {
  return apiRequest<BackendConversation>(`/conversations/${conversationId}/claim`, { method: "POST" })
}

export function sendConversationMessage(
  conversationId: string,
  payload: {
    type: "text" | "image"
    body?: string
    clientTempId: string
    mediaBase64?: string
    mediaMimeType?: string
    mediaFileName?: string
    replyToMessageId?: string
  },
) {
  return apiRequest<BackendMessage>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateConversation(conversationId: string, action: string, body?: Record<string, unknown>) {
  return apiRequest<BackendConversation>(`/conversations/${conversationId}/${action}`, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  })
}

export function getQueueStats() {
  return apiRequest<{ unassigned: number; assigned: number; oldestWaitingSeconds: number }>("/conversations/stats/queue")
}

export const MEDIA_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, "")

export function markConversationRead(conversationId: string, lastMessageId: string) {
  return apiRequest<BackendConversation>(`/conversations/${conversationId}/read`, {
    method: "POST",
    body: JSON.stringify({ lastMessageId }),
  })
}

export type WhatsAppState =
  | "disconnected"
  | "authenticating"
  | "qr"
  | "ready"
  | "failed"

export type WhatsAppStatus = {
  state: WhatsAppState
  whatsappState?: string
  ready?: boolean
  phoneNumber: string | null
  connectedAt: string | null
  error?: string | null
  qr?: string | null
}

export type WhatsAppSocketAck<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

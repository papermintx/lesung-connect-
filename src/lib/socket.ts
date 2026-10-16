import { io } from "socket.io-client"
import { API_BASE_URL, refreshAccessToken } from "@/lib/api"
import type { WhatsAppSocketAck, WhatsAppStatus } from "@/types/whatsapp"
import { logError, logRequest, logResponse } from "@/lib/logger"

export const socket = io(API_BASE_URL.replace(/\/api\/v1$/, ""), {
  autoConnect: false,
  path: "/socket.io",
  transports: ["polling"],
  upgrade: false,
  rememberUpgrade: false,
  timeout: 30000,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  auth: () => {
    const token = localStorage.getItem("accessToken")
    return token ? { token } : {}
  },
})

let refreshingSocketAuth = false
let connectionPromise: Promise<void> | null = null

function socketContext() {
  return {
    url: API_BASE_URL.replace(/\/api\/v1$/, ""),
    path: "/socket.io",
    connected: socket.connected,
    socketId: socket.id ?? null,
    transport: socket.io.engine?.transport.name ?? null,
    hasAccessToken: Boolean(localStorage.getItem("accessToken")),
  }
}

socket.on("connect_error", (error) => {
  logError("SOCKET", "connect_error", 0, { message: error.message, ...socketContext() })
  if (refreshingSocketAuth || !/UNAUTHORIZED|jwt|token|expired/i.test(error.message)) return
  refreshingSocketAuth = true
  void refreshAccessToken()
    .then(() => {
      if (!socket.connected) socket.connect()
    })
    .catch(() => undefined)
    .finally(() => {
      refreshingSocketAuth = false
    })
})

socket.io.on("open", () => {
  logResponse("SOCKET", "engine:open", 0, socketContext())
  const engine = socket.io.engine
  engine?.on("packetCreate", (packet) => {
    logRequest("SOCKET", `engine:packet:${packet.type}`, {
      hasData: packet.data !== undefined,
      dataLength: typeof packet.data === "string" ? packet.data.length : undefined,
    })
  })
  engine?.on("packet", (packet) => {
    logResponse("SOCKET", `engine:packet:${packet.type}`, 0, {
      hasData: packet.data !== undefined,
      dataLength: typeof packet.data === "string" ? packet.data.length : undefined,
    })
  })
})

socket.io.on("close", (reason) => {
  logResponse("SOCKET", "engine:close", 0, { reason, ...socketContext() })
})

socket.io.on("error", (error) => {
  logError("SOCKET", "engine:error", 0, error)
})

socket.on("connect", () => {
  logResponse("SOCKET", "connect", 0, socketContext())
  socket.emit("realtime:ping", (response: unknown) => {
    logResponse("SOCKET", "ack:realtime:ping", 0, response)
  })


})

socket.on("disconnect", (reason) => {
  logResponse("SOCKET", "disconnect", 0, { reason, ...socketContext() })
})

socket.io.on("reconnect_attempt", (attempt) => {
  logRequest("SOCKET", `reconnect_attempt:${attempt}`, socketContext())
})

socket.io.on("reconnect_error", (error) => {
  logError("SOCKET", "reconnect_error", 0, { message: error.message, ...socketContext() })
})

socket.onAny((event, ...args) => {
  const payload = args.length === 1 ? args[0] : args
  logResponse("SOCKET", `event:${event}`, 0, payload)
})

export type SocketAck<T> = (response: WhatsAppSocketAck<T>) => void

export function connectSocket() {
  return ensureSocketConnected()
}

function ensureSocketConnected() {
  if (socket.connected) return Promise.resolve()
  if (connectionPromise) return connectionPromise

  connectionPromise = new Promise<void>((resolve, reject) => {
    let settled = false
    const timeout = window.setTimeout(() => {
      finish()
      reject(new Error("Socket.IO timeout: server tidak terhubung."))
    }, 30000)

    function finish() {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      socket.off("connect", handleConnect)
      socket.off("connect_error", handleError)
    }

    function handleConnect() {
      finish()
      logResponse("SOCKET", "handshake", 0, socketContext())
      resolve()
    }

    function handleError(error: Error) {
      finish()
      logError("SOCKET", "handshake", 0, { message: error.message, ...socketContext() })
      reject(error)
    }

    socket.once("connect", handleConnect)
    socket.once("connect_error", handleError)
    logRequest("SOCKET", "connect", socketContext())
    socket.connect()
  }).finally(() => {
    connectionPromise = null
  })

  return connectionPromise
}

export async function requestSocket<T>(event: string, payload: unknown = null) {
  try {
    await ensureSocketConnected()
  } catch (connectionError) {
    logError("SOCKET", `emit:${event}`, 0, connectionError)
    throw connectionError
  }
  const startedAt = performance.now()
  logRequest("SOCKET", `emit:${event}`, payload)
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      const requestError = new Error(`Socket.IO ACK timeout: ${event}`)
      logError("SOCKET", `ack:${event}`, performance.now() - startedAt, requestError)
      reject(requestError)
    }, 15000)

    socket.emit(event, payload, (response: WhatsAppSocketAck<T>) => {
      window.clearTimeout(timeout)
      if (response.ok) {
        logResponse("SOCKET", `ack:${event}`, performance.now() - startedAt, response)
        resolve(response.data)
      } else {
        const requestError = new Error(response.error)
        logError("SOCKET", `ack:${event}`, performance.now() - startedAt, requestError)
        reject(requestError)
      }
    })
  })
}

export function emitSocket(event: string, ...args: unknown[]) {
  void ensureSocketConnected()
    .then(() => {
      logRequest("SOCKET", `emit:${event}`, args.length === 1 ? args[0] : args)
      socket.emit(event, ...args)
    })
    .catch((requestError) => {
      logError("SOCKET", `emit:${event}`, 0, requestError)
    })
}

export function requestWhatsAppStatus() {
  return requestSocket<WhatsAppStatus>("whatsapp:status")
}

export function connectWhatsApp() {
  return requestSocket<WhatsAppStatus>("whatsapp:connect")
}

export function requestWhatsAppQr() {
  return requestSocket<{ qr: string }>("whatsapp:qr")
}

export function logoutWhatsApp() {
  return requestSocket<WhatsAppStatus>("whatsapp:logout")
}

export function restartWhatsApp() {
  return requestSocket<WhatsAppStatus>("whatsapp:restart")
}

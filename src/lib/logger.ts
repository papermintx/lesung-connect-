type LogPayload = Record<string, unknown> | unknown

const isDevelopment = import.meta.env.DEV

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]"
  if (typeof value === "string") {
    if (value.length > 500) return `${value.slice(0, 500)}… [truncated]`
    return value
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitize(item, depth + 1))
  if (!value || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      const normalizedKey = key.toLowerCase()
      if (
        normalizedKey.includes("token") ||
        normalizedKey.includes("authorization") ||
        normalizedKey.includes("password") ||
        normalizedKey.includes("secret") ||
        normalizedKey.includes("base64")
      ) {
        return [key, "[redacted]"]
      }
      return [key, sanitize(entry, depth + 1)]
    }),
  )
}

function timestamp() {
  return new Date().toISOString()
}

export function logRequest(kind: "REST" | "SOCKET", target: string, payload?: LogPayload) {
  if (!isDevelopment) return
  console.info(`[${timestamp()}] [${kind}] REQUEST ${target}`, payload === undefined ? "" : sanitize(payload))
}

export function logResponse(
  kind: "REST" | "SOCKET",
  target: string,
  durationMs: number,
  payload?: LogPayload,
) {
  if (!isDevelopment) return
  console.info(
    `[${timestamp()}] [${kind}] RESPONSE ${target} (${Math.round(durationMs)}ms)`,
    payload === undefined ? "" : sanitize(payload),
  )
}

export function logError(
  kind: "REST" | "SOCKET",
  target: string,
  durationMs: number,
  error: unknown,
) {
  if (!isDevelopment) return
  console.error(`[${timestamp()}] [${kind}] ERROR ${target} (${Math.round(durationMs)}ms)`, error)
}

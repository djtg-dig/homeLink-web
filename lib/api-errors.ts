type ApiErrorRecord = Record<string, unknown>

function isRecord(value: unknown): value is ApiErrorRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function stringifyValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(stringifyValue).filter(Boolean).join(" ")
  }

  if (typeof value === "string") {
    return value
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  if (isRecord(value)) {
    return formatApiMessage(value, "")
  }

  return ""
}

function fieldLabel(field: string) {
  return field.replaceAll("_", " ")
}

function isTechnicalMessage(message: string) {
  const normalizedMessage = message.trim()

  return (
    !normalizedMessage ||
    normalizedMessage.startsWith("<") ||
    /Traceback|ProgrammingError|OperationalError|IntegrityError|Exception Type|Request Method|Django Version|LINE \d+:|column .* does not exist/i.test(
      normalizedMessage
    )
  )
}

export function formatApiMessage(body: unknown, fallback: string) {
  if (!body) {
    return fallback
  }

  if (typeof body === "string") {
    return isTechnicalMessage(body) ? fallback : body
  }

  if (!isRecord(body)) {
    return fallback
  }

  for (const key of ["message", "detail", "error", "non_field_errors"]) {
    const message = stringifyValue(body[key])

    if (message) {
      return isTechnicalMessage(message) ? fallback : message
    }
  }

  const messages = Object.entries(body)
    .map(([key, value]) => {
      const message = stringifyValue(value)

      return message ? `${fieldLabel(key)}: ${message}` : ""
    })
    .filter(Boolean)

  const message = messages.join(" ")

  return message && !isTechnicalMessage(message) ? message : fallback
}

export async function readResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""
  const text = await response.text()

  if (!text) {
    return null
  }

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  return text
}

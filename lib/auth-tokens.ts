type TokenRecord = Record<string, unknown>

const ACCESS_TOKEN_KEYS = [
  "token",
  "access",
  "access_token",
  "auth_token",
  "key",
]

const REFRESH_TOKEN_KEYS = ["refresh", "refresh_token"]

const TOKEN_KEYS = new Set([
  ...ACCESS_TOKEN_KEYS,
  ...REFRESH_TOKEN_KEYS,
  "password",
  "confirm_password",
])

function isRecord(value: unknown): value is TokenRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function asString(value: unknown) {
  return typeof value === "string" && value ? value : undefined
}

function candidateRecords(body: unknown) {
  const records: TokenRecord[] = []

  if (isRecord(body)) {
    records.push(body)

    for (const key of ["data", "tokens", "auth"]) {
      const nested = body[key]

      if (isRecord(nested)) {
        records.push(nested)
      }
    }
  }

  return records
}

function tokenScheme(key: string) {
  return key === "access" || key === "access_token" ? "Bearer" : "Token"
}

export function extractAuthTokens(body: unknown) {
  for (const record of candidateRecords(body)) {
    for (const key of ACCESS_TOKEN_KEYS) {
      const accessToken = asString(record[key])

      if (accessToken) {
        const refreshToken = REFRESH_TOKEN_KEYS.map((refreshKey) =>
          asString(record[refreshKey])
        ).find(Boolean)

        return {
          accessToken,
          refreshToken,
          scheme: tokenScheme(key),
        }
      }
    }
  }

  return null
}

export function stripAuthTokens(body: unknown): unknown {
  if (Array.isArray(body)) {
    return body.map(stripAuthTokens)
  }

  if (!isRecord(body)) {
    return body
  }

  return Object.fromEntries(
    Object.entries(body)
      .filter(([key]) => !TOKEN_KEYS.has(key))
      .map(([key, value]) => [key, stripAuthTokens(value)])
  )
}

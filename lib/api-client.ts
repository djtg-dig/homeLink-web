import { readResponseBody } from "@/lib/api-errors"
import { getStoredAuthorizationHeader } from "@/lib/auth-storage"

const API_PROXY_PREFIX = "/api/proxy"

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly statusText: string,
    readonly body: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function apiUrl(path = "") {
  const pathWithoutLeadingSlash = path.replace(/^\/+/, "")
  const queryIndex = pathWithoutLeadingSlash.indexOf("?")
  const pathname =
    queryIndex === -1
      ? pathWithoutLeadingSlash
      : pathWithoutLeadingSlash.slice(0, queryIndex)
  const suffix =
    queryIndex === -1 ? "" : pathWithoutLeadingSlash.slice(queryIndex)
  const normalizedPath = `${pathname.replace(/\/+$/, "")}${suffix}`

  return normalizedPath
    ? `${API_PROXY_PREFIX}/${normalizedPath}`
    : API_PROXY_PREFIX
}

export async function apiFetch<TResponse>(
  path: string,
  init?: RequestInit
): Promise<TResponse> {
  const headers = new Headers(init?.headers)

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
  }

  if (!headers.has("Authorization")) {
    const authorization = getStoredAuthorizationHeader()

    if (authorization) {
      headers.set("Authorization", authorization)
    }
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
  })

  if (!response.ok) {
    const body = await readResponseBody(response)

    throw new ApiError(
      "La requete API a echoue.",
      response.status,
      response.statusText,
      body
    )
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return readResponseBody(response) as Promise<TResponse>
}

export function jsonHeaders(headers?: HeadersInit) {
  const nextHeaders = new Headers(headers)

  if (!nextHeaders.has("Accept")) {
    nextHeaders.set("Accept", "application/json")
  }

  if (!nextHeaders.has("Content-Type")) {
    nextHeaders.set("Content-Type", "application/json")
  }

  return nextHeaders
}

export function apiPostJson<TResponse>(
  path: string,
  payload: unknown,
  init?: RequestInit
) {
  return apiFetch<TResponse>(path, {
    ...init,
    body: JSON.stringify(payload),
    headers: jsonHeaders(init?.headers),
    method: "POST",
  })
}

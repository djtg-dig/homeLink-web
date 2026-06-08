import { readResponseBody } from "@/lib/api-errors"
import { getStoredAuthorizationHeader } from "@/lib/auth-storage"

const API_PROXY_PREFIX = "/api/proxy"
const NETWORK_ERROR_EVENT_NAME = "homelink:network-error"
const NETWORK_ERROR_STATUSES = new Set([502, 503, 504])

type NetworkErrorEventDetail = {
  message: string
}

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

export class ApiNetworkError extends Error {
  constructor(message = "Connexion indisponible.") {
    super(message)
    this.name = "ApiNetworkError"
  }
}

function dispatchNetworkError(message: string) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent<NetworkErrorEventDetail>(NETWORK_ERROR_EVENT_NAME, {
      detail: { message },
    })
  )
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

  let response: Response

  try {
    response = await fetch(apiUrl(path), {
      ...init,
      headers,
    })
  } catch (caughtError) {
    if (init?.signal?.aborted) {
      throw caughtError
    }

    const message =
      "Votre connexion semble interrompue. Vérifiez le réseau puis réessayez."

    dispatchNetworkError(message)

    throw new ApiNetworkError(message)
  }

  if (!response.ok) {
    const body = await readResponseBody(response)

    if (NETWORK_ERROR_STATUSES.has(response.status)) {
      dispatchNetworkError(
        "Le service ne répond pas pour le moment. Réessayez dans un instant."
      )
    }

    throw new ApiError(
      "La requête a échoué.",
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

export {
  NETWORK_ERROR_EVENT_NAME,
  type NetworkErrorEventDetail,
}

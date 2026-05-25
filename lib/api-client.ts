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
  const normalizedPath = path.replace(/^\/+/, "")

  return normalizedPath
    ? `${API_PROXY_PREFIX}/${normalizedPath}`
    : API_PROXY_PREFIX
}

async function readResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""
  const text = await response.text()

  if (!text) {
    return null
  }

  if (contentType.includes("application/json")) {
    return JSON.parse(text)
  }

  return text
}

export async function apiFetch<TResponse>(
  path: string,
  init?: RequestInit
): Promise<TResponse> {
  const headers = new Headers(init?.headers)

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
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

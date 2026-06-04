import { NextRequest } from "next/server"

import {
  AUTH_ACCESS_TOKEN_COOKIE,
  AUTH_TOKEN_SCHEME_COOKIE,
} from "@/lib/auth-cookies"
import { buildUpstreamUrl } from "@/lib/server-api"

const BODYLESS_METHODS = new Set(["GET", "HEAD", "OPTIONS"])
const DEFAULT_PROXY_TIMEOUT_MS = 30_000
const PROXY_RETRY_DELAY_MS = 250

export const maxDuration = 60

const REQUEST_HEADER_BLOCKLIST = new Set([
  "accept-encoding",
  "connection",
  "content-length",
  "cookie",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
])

const RESPONSE_HEADER_BLOCKLIST = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
])

type ProxyRouteContext = {
  params: Promise<{
    path?: string[]
  }>
}

function buildTargetUrl(path: string[], request: NextRequest) {
  const encodedPath = path
    .map((segment) => encodeURIComponent(segment))
    .join("/")
  const targetPath = encodedPath ? `${encodedPath}/` : encodedPath

  return buildUpstreamUrl(targetPath, request.nextUrl.search)
}

function buildRequestHeaders(request: NextRequest) {
  const headers = new Headers()

  request.headers.forEach((value, key) => {
    if (!REQUEST_HEADER_BLOCKLIST.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  })

  headers.set("x-forwarded-host", request.headers.get("host") ?? "")
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""))

  if (!headers.has("authorization")) {
    const token = request.cookies.get(AUTH_ACCESS_TOKEN_COOKIE)?.value
    const scheme =
      request.cookies.get(AUTH_TOKEN_SCHEME_COOKIE)?.value ?? "Bearer"

    if (token) {
      headers.set("authorization", `${scheme} ${token}`)
    }
  }

  return headers
}

function buildResponseHeaders(upstreamHeaders: Headers) {
  const headers = new Headers()

  upstreamHeaders.forEach((value, key) => {
    if (!RESPONSE_HEADER_BLOCKLIST.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  })

  return headers
}

function getProxyTimeoutMs() {
  const timeout = Number(process.env.API_PROXY_TIMEOUT_MS)

  return Number.isFinite(timeout) && timeout > 0
    ? timeout
    : DEFAULT_PROXY_TIMEOUT_MS
}

function isTimeoutError(error: unknown) {
  if (error instanceof DOMException) {
    return error.name === "AbortError" || error.name === "TimeoutError"
  }

  if (error instanceof Error && "cause" in error) {
    const cause = error.cause

    return (
      typeof cause === "object" &&
      cause !== null &&
      "code" in cause &&
      cause.code === "UND_ERR_CONNECT_TIMEOUT"
    )
  }

  return false
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithTimeout(
  targetUrl: URL,
  request: NextRequest,
  timeoutMs: number
) {
  const body = BODYLESS_METHODS.has(request.method)
    ? undefined
    : await request.arrayBuffer()
  const startedAt = Date.now()
  const deadline = startedAt + timeoutMs
  let lastError: unknown

  while (Date.now() < deadline) {
    const remainingMs = deadline - Date.now()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), remainingMs)

    try {
      return await fetch(targetUrl, {
        body,
        cache: "no-store",
        headers: buildRequestHeaders(request),
        method: request.method,
        redirect: "manual",
        signal: controller.signal,
      })
    } catch (caughtError) {
      lastError = caughtError

      if (!isTimeoutError(caughtError)) {
        throw caughtError
      }

      const nextRemainingMs = deadline - Date.now()

      if (nextRemainingMs <= PROXY_RETRY_DELAY_MS) {
        break
      }

      await sleep(Math.min(PROXY_RETRY_DELAY_MS, nextRemainingMs))
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError
}

async function proxyRequest(request: NextRequest, context: ProxyRouteContext) {
  let targetUrl: URL

  try {
    const { path = [] } = await context.params
    targetUrl = buildTargetUrl(path, request)
  } catch {
    return Response.json(
      { message: "La configuration du service est manquante." },
      { status: 500 }
    )
  }

  try {
    const upstreamResponse = await fetchWithTimeout(
      targetUrl,
      request,
      getProxyTimeoutMs()
    )

    return new Response(upstreamResponse.body, {
      headers: buildResponseHeaders(upstreamResponse.headers),
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
    })
  } catch (caughtError) {
    if (isTimeoutError(caughtError)) {
      return Response.json(
        { message: "Le délai d'attente du service est dépassé." },
        { status: 504 }
      )
    }

    return Response.json(
      { message: "Le service est momentanément indisponible." },
      { status: 502 }
    )
  }
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const PATCH = proxyRequest
export const DELETE = proxyRequest
export const HEAD = proxyRequest
export const OPTIONS = proxyRequest

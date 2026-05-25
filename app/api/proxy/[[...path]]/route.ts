import { NextRequest } from "next/server"

const BODYLESS_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

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

function getApiBaseUrl() {
  const apiBaseUrl = process.env.API_BASE_URL ?? process.env.VITE_API_BASE_URL

  if (!apiBaseUrl) {
    throw new Error("API_BASE_URL is not configured")
  }

  return apiBaseUrl
}

function buildTargetUrl(path: string[], request: NextRequest) {
  const baseUrl = getApiBaseUrl()
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
  const encodedPath = path
    .map((segment) => encodeURIComponent(segment))
    .join("/")
  const targetUrl = new URL(encodedPath, normalizedBaseUrl)

  targetUrl.search = request.nextUrl.search

  return targetUrl
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

async function proxyRequest(request: NextRequest, context: ProxyRouteContext) {
  let targetUrl: URL

  try {
    const { path = [] } = await context.params
    targetUrl = buildTargetUrl(path, request)
  } catch {
    return Response.json(
      { message: "La configuration API est manquante." },
      { status: 500 }
    )
  }

  try {
    const upstreamResponse = await fetch(targetUrl, {
      body: BODYLESS_METHODS.has(request.method)
        ? undefined
        : await request.arrayBuffer(),
      cache: "no-store",
      headers: buildRequestHeaders(request),
      method: request.method,
      redirect: "manual",
    })

    return new Response(upstreamResponse.body, {
      headers: buildResponseHeaders(upstreamResponse.headers),
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
    })
  } catch {
    return Response.json(
      { message: "Le service API est momentanement indisponible." },
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

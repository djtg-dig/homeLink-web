import "server-only"

import { readResponseBody } from "@/lib/api-errors"

export function getApiBaseUrl() {
  const apiBaseUrl = process.env.API_BASE_URL ?? process.env.VITE_API_BASE_URL

  if (!apiBaseUrl) {
    throw new Error("API_BASE_URL is not configured")
  }

  return apiBaseUrl
}

export function buildUpstreamUrl(path: string, search = "") {
  const baseUrl = getApiBaseUrl()
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
  const normalizedPath = path.replace(/^\/+/, "")
  const targetUrl = new URL(normalizedPath, normalizedBaseUrl)

  targetUrl.search = search

  return targetUrl
}

export async function postUpstreamJson(path: string, payload: unknown) {
  const response = await fetch(buildUpstreamUrl(path), {
    body: JSON.stringify(payload),
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  return {
    body: await readResponseBody(response),
    response,
  }
}

import { NextRequest, NextResponse } from "next/server"

import { buildUpstreamUrl } from "@/lib/server-api"

const DJANA_LOGIN_ENDPOINT = "/api/auth/djana/login/"

function getDjanaLoginUrl() {
  const configuredLoginUrl =
    process.env.DJANA_AUTH_LOGIN_URL?.trim() ||
    process.env.NEXT_PUBLIC_DJANA_AUTH_LOGIN_URL?.trim() ||
    process.env.VITE_DJANA_AUTH_LOGIN_URL?.trim()

  if (configuredLoginUrl) {
    return configuredLoginUrl
  }

  return buildUpstreamUrl(DJANA_LOGIN_ENDPOINT).toString()
}

function redirectToDjana(request: NextRequest, status: 302 | 303) {
  const targetUrl = new URL(getDjanaLoginUrl())
  const nextPath = request.nextUrl.searchParams.get("next")

  if (nextPath?.startsWith("/") && !nextPath.startsWith("//")) {
    targetUrl.searchParams.set("next", nextPath)
  }

  return NextResponse.redirect(targetUrl, status)
}

export function GET(request: NextRequest) {
  return redirectToDjana(request, 302)
}

export function POST(request: NextRequest) {
  return redirectToDjana(request, 303)
}

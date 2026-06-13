import { NextRequest, NextResponse } from "next/server"

import {
  authCookieOptions,
  AUTH_ACCESS_TOKEN_COOKIE,
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_TOKEN_SCHEME_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
} from "@/lib/auth-cookies"
import { extractAuthTokens } from "@/lib/auth-tokens"

async function readJsonRequest(request: NextRequest) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const tokens = extractAuthTokens(await readJsonRequest(request))

  if (!tokens) {
    return NextResponse.json(
      { message: "Jeton d'authentification manquant." },
      { status: 400 }
    )
  }

  const response = NextResponse.json({
    access: tokens.accessToken,
    refresh: tokens.refreshToken ?? null,
  })

  response.cookies.set(
    AUTH_ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    authCookieOptions()
  )
  response.cookies.set(
    AUTH_TOKEN_SCHEME_COOKIE,
    tokens.scheme,
    authCookieOptions()
  )

  if (tokens.refreshToken) {
    response.cookies.set(
      AUTH_REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      authCookieOptions(REFRESH_TOKEN_MAX_AGE)
    )
  } else {
    response.cookies.delete(AUTH_REFRESH_TOKEN_COOKIE)
  }

  return response
}

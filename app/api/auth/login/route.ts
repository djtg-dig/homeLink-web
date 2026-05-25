import { NextRequest, NextResponse } from "next/server"

import {
  authCookieOptions,
  AUTH_ACCESS_TOKEN_COOKIE,
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_TOKEN_SCHEME_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
} from "@/lib/auth-cookies"
import { extractAuthTokens } from "@/lib/auth-tokens"
import { formatApiMessage } from "@/lib/api-errors"
import { postUpstreamJson } from "@/lib/server-api"

const LOGIN_ENDPOINT = "/api/accounts/login/"

type LoginPayload = {
  email: string
  password: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function validateLoginPayload(body: unknown) {
  if (!isRecord(body)) {
    return {
      errors: { form: ["Payload invalide."] },
      payload: null,
    }
  }

  const email = typeof body.email === "string" ? body.email.trim() : ""
  const password = typeof body.password === "string" ? body.password : ""
  const errors: Record<string, string[]> = {}

  if (!email) {
    errors.email = ["Email requis."]
  }

  if (!password) {
    errors.password = ["Mot de passe requis."]
  }

  return {
    errors,
    payload:
      Object.keys(errors).length === 0
        ? ({
            email,
            password,
          } satisfies LoginPayload)
        : null,
  }
}

async function readJsonRequest(request: NextRequest) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const { errors, payload } = validateLoginPayload(
    await readJsonRequest(request)
  )

  if (!payload) {
    return NextResponse.json(
      { errors, message: "Verifier les informations de connexion." },
      { status: 400 }
    )
  }

  try {
    const { body, response } = await postUpstreamJson(LOGIN_ENDPOINT, payload)

    if (!response.ok) {
      return NextResponse.json(
        {
          errors: body,
          message: formatApiMessage(body, "Identifiants invalides."),
        },
        { status: response.status }
      )
    }

    const tokens = extractAuthTokens(body)

    if (!tokens) {
      return NextResponse.json(
        { message: "Connexion acceptee, mais aucun token n'a ete renvoye." },
        { status: 502 }
      )
    }

    const nextResponse = NextResponse.json({
      access: tokens.accessToken,
      refresh: tokens.refreshToken ?? null,
    })

    nextResponse.cookies.set(
      AUTH_ACCESS_TOKEN_COOKIE,
      tokens.accessToken,
      authCookieOptions()
    )
    nextResponse.cookies.set(
      AUTH_TOKEN_SCHEME_COOKIE,
      tokens.scheme,
      authCookieOptions()
    )

    if (tokens.refreshToken) {
      nextResponse.cookies.set(
        AUTH_REFRESH_TOKEN_COOKIE,
        tokens.refreshToken,
        authCookieOptions(REFRESH_TOKEN_MAX_AGE)
      )
    }

    return nextResponse
  } catch {
    return NextResponse.json(
      { message: "Le service de connexion est indisponible." },
      { status: 502 }
    )
  }
}

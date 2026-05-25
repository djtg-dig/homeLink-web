import { NextRequest, NextResponse } from "next/server"

import { formatApiMessage } from "@/lib/api-errors"
import { stripAuthTokens } from "@/lib/auth-tokens"
import { postUpstreamJson } from "@/lib/server-api"

const REGISTER_ENDPOINT = "/api/accounts/register/"

type RegisterPayload = {
  confirm_password: string
  email: string
  first_name: string
  last_name: string
  password: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function validateRegisterPayload(body: unknown) {
  if (!isRecord(body)) {
    return {
      errors: { form: ["Payload invalide."] },
      payload: null,
    }
  }

  const email = typeof body.email === "string" ? body.email.trim() : ""
  const firstName =
    typeof body.first_name === "string" ? body.first_name.trim() : ""
  const lastName =
    typeof body.last_name === "string" ? body.last_name.trim() : ""
  const password = typeof body.password === "string" ? body.password : ""
  const confirmPassword =
    typeof body.confirm_password === "string" ? body.confirm_password : ""
  const errors: Record<string, string[]> = {}

  if (!email) {
    errors.email = ["Email requis."]
  }

  if (!firstName) {
    errors.first_name = ["Prenom requis."]
  }

  if (!lastName) {
    errors.last_name = ["Nom requis."]
  }

  if (password.length < 8) {
    errors.password = ["Le mot de passe doit contenir au moins 8 caracteres."]
  }

  if (confirmPassword !== password) {
    errors.confirm_password = ["Les mots de passe ne correspondent pas."]
  }

  return {
    errors,
    payload:
      Object.keys(errors).length === 0
        ? ({
            confirm_password: confirmPassword,
            email,
            first_name: firstName,
            last_name: lastName,
            password,
          } satisfies RegisterPayload)
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
  const { errors, payload } = validateRegisterPayload(
    await readJsonRequest(request)
  )

  if (!payload) {
    return NextResponse.json(
      { errors, message: "Verifier les informations d'inscription." },
      { status: 400 }
    )
  }

  try {
    const { body, response } = await postUpstreamJson(
      REGISTER_ENDPOINT,
      payload
    )

    if (!response.ok) {
      return NextResponse.json(
        {
          errors: body,
          message: formatApiMessage(body, "Inscription impossible."),
        },
        { status: response.status }
      )
    }

    return NextResponse.json(
      {
        data: stripAuthTokens(body),
        message: "Inscription reussie.",
      },
      { status: response.status === 204 ? 200 : response.status }
    )
  } catch {
    return NextResponse.json(
      { message: "Le service d'inscription est indisponible." },
      { status: 502 }
    )
  }
}

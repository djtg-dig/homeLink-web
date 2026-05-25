import { NextRequest, NextResponse } from "next/server"

import { formatApiMessage, readResponseBody } from "@/lib/api-errors"
import { buildUpstreamUrl } from "@/lib/server-api"

const ACCOUNT_ME_ENDPOINT = "/api/accounts/me/"

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json(
      { message: "Token d'authentification manquant." },
      { status: 401 }
    )
  }

  try {
    const response = await fetch(buildUpstreamUrl(ACCOUNT_ME_ENDPOINT), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: authorization,
      },
      method: "GET",
    })
    const body = await readResponseBody(response)

    if (!response.ok) {
      return NextResponse.json(
        {
          errors: body,
          message: formatApiMessage(
            body,
            "Impossible de recuperer le profil connecte."
          ),
        },
        { status: response.status }
      )
    }

    return NextResponse.json(body)
  } catch {
    return NextResponse.json(
      { message: "Le service de profil est indisponible." },
      { status: 502 }
    )
  }
}

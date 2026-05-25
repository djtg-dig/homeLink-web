import { NextResponse } from "next/server"

import {
  AUTH_ACCESS_TOKEN_COOKIE,
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_TOKEN_SCHEME_COOKIE,
} from "@/lib/auth-cookies"

export async function POST() {
  const response = NextResponse.json({ message: "Deconnexion reussie." })

  response.cookies.delete(AUTH_ACCESS_TOKEN_COOKIE)
  response.cookies.delete(AUTH_REFRESH_TOKEN_COOKIE)
  response.cookies.delete(AUTH_TOKEN_SCHEME_COOKIE)

  return response
}

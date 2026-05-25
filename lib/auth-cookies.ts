export const AUTH_ACCESS_TOKEN_COOKIE = "homelink_access_token"
export const AUTH_REFRESH_TOKEN_COOKIE = "homelink_refresh_token"
export const AUTH_TOKEN_SCHEME_COOKIE = "homelink_token_scheme"

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 7
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30

export function authCookieOptions(maxAge = ACCESS_TOKEN_MAX_AGE) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  }
}

export { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE }

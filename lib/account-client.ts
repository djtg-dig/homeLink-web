import { readResponseBody } from "@/lib/api-errors"
import type { AccountProfile } from "@/lib/account-profile"
import { getStoredAuthorizationHeader } from "@/lib/auth-storage"

export const ACCOUNT_ME_ENDPOINT = "/api/auth/me"

export async function fetchCurrentAccountProfile() {
  const authorization = getStoredAuthorizationHeader()

  if (!authorization) {
    return null
  }

  const response = await fetch(ACCOUNT_ME_ENDPOINT, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: authorization,
    },
  })

  if (!response.ok) {
    return null
  }

  return (await readResponseBody(response)) as AccountProfile
}

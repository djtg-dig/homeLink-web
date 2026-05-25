"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, apiFetch } from "@/lib/api-client"
import {
  AUTH_STORAGE_EVENT,
  clearStoredAuthTokens,
  getStoredAccessToken,
} from "@/lib/auth-storage"

type AccountProfile = {
  address: string | null
  date_joined: string
  email: string
  first_name: string
  id: string
  is_email_verified: boolean
  last_name: string
  phone_number: string | null
}

type AccountState =
  | { status: "checking" }
  | { status: "anonymous" }
  | { status: "authenticated"; profile: AccountProfile }

function initials(profile: AccountProfile) {
  const first = profile.first_name.at(0) ?? ""
  const last = profile.last_name.at(0) ?? ""

  return `${first}${last}`.toUpperCase() || profile.email.at(0)?.toUpperCase()
}

function AccountStatusSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-9 rounded-md bg-white/15" />
      <Skeleton className="hidden h-9 w-24 rounded-md bg-white/15 sm:block" />
    </div>
  )
}

function AccountStatus() {
  const router = useRouter()
  const [state, setState] = React.useState<AccountState>({
    status: "checking",
  })

  const loadProfile = React.useCallback(async () => {
    if (!getStoredAccessToken()) {
      setState({ status: "anonymous" })
      return
    }

    setState({ status: "checking" })

    try {
      const profile = await apiFetch<AccountProfile>("/accounts/me/")
      setState({ status: "authenticated", profile })
    } catch (error) {
      if (error instanceof ApiError && [401, 403].includes(error.status)) {
        clearStoredAuthTokens()
      }

      setState({ status: "anonymous" })
    }
  }, [])

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile()
    }, 0)

    function onStorage(event: StorageEvent) {
      if (
        !event.key ||
        event.key === "homelink.access_token" ||
        event.key === "homelink.refresh_token"
      ) {
        void loadProfile()
      }
    }

    window.addEventListener(AUTH_STORAGE_EVENT, loadProfile)
    window.addEventListener("storage", onStorage)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(AUTH_STORAGE_EVENT, loadProfile)
      window.removeEventListener("storage", onStorage)
    }
  }, [loadProfile])

  async function logout() {
    clearStoredAuthTokens()
    setState({ status: "anonymous" })
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null)
    router.refresh()
  }

  if (state.status === "checking") {
    return <AccountStatusSkeleton />
  }

  if (state.status === "anonymous") {
    return (
      <Button
        asChild
        size="sm"
        className="h-9 bg-brand-orange px-3 text-brand-navy hover:bg-brand-orange/90 sm:px-4"
      >
        <Link href="/register">S&apos;inscrire</Link>
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 items-center gap-2 rounded-md border border-white/15 bg-white/8 px-2 text-white">
        <span className="flex size-6 items-center justify-center rounded bg-brand-cyan text-xs font-semibold text-brand-navy">
          {initials(state.profile)}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-medium sm:block">
          {state.profile.first_name || state.profile.email}
        </span>
      </div>
      <Button
        size="icon-sm"
        variant="outline"
        className="border-white/20 bg-white/8 text-white hover:bg-white/14 hover:text-white"
        type="button"
        title="Deconnexion"
        onClick={logout}
      >
        <LogOut />
      </Button>
    </div>
  )
}

export { AccountStatus, type AccountProfile }

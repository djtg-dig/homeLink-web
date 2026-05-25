"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, LayoutDashboard, LogOut, Mail } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchCurrentAccountProfile } from "@/lib/account-client"
import type { AccountProfile } from "@/lib/account-profile"
import { AUTH_STORAGE_EVENT, clearStoredAuthTokens } from "@/lib/auth-storage"

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
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [state, setState] = React.useState<AccountState>({
    status: "checking",
  })
  const [menuOpen, setMenuOpen] = React.useState(false)

  const loadProfile = React.useCallback(async () => {
    setState({ status: "checking" })

    try {
      const profile = await fetchCurrentAccountProfile()

      if (!profile) {
        clearStoredAuthTokens()
        setState({ status: "anonymous" })
        return
      }

      setState({ status: "authenticated", profile })
    } catch {
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

  React.useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  async function logout() {
    clearStoredAuthTokens()
    setMenuOpen(false)
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
    <div className="relative z-30" ref={menuRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        className="flex h-9 max-w-[11rem] items-center gap-2 rounded-md border border-white/15 bg-white/8 px-2 text-white transition outline-none hover:bg-white/14 focus-visible:border-brand-cyan focus-visible:ring-3 focus-visible:ring-brand-cyan/30 sm:max-w-none"
      >
        <span className="flex size-6 items-center justify-center rounded bg-brand-cyan text-xs font-semibold text-brand-navy">
          {initials(state.profile)}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-medium sm:block">
          {state.profile.first_name || state.profile.email}
        </span>
        <ChevronDown className="size-4 opacity-75" />
      </button>

      <div
        role="menu"
        className={`absolute top-11 right-0 z-30 w-64 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg transition ${
          menuOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <div className="border-b border-border p-3">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              {initials(state.profile)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {state.profile.first_name} {state.profile.last_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {state.profile.email}
              </p>
            </div>
          </div>
        </div>

        <div className="p-1">
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-muted"
            onClick={() => {
              setMenuOpen(false)
              router.push("/dashboard")
            }}
          >
            <LayoutDashboard className="size-4" />
            Dashboard
          </button>
          <a
            role="menuitem"
            href={`mailto:${state.profile.email}`}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-muted"
          >
            <Mail className="size-4" />
            {state.profile.email}
          </a>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive transition hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            Deconnexion
          </button>
        </div>
      </div>
    </div>
  )
}

export { AccountStatus, type AccountProfile }

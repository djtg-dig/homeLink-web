"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Home,
  Hotel,
  House,
  Landmark,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Search,
  Store,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react"
import * as React from "react"

import { HomelinkLogo } from "@/components/homelink-logo"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchCurrentAccountProfile } from "@/lib/account-client"
import type { AccountProfile } from "@/lib/account-profile"
import { AUTH_STORAGE_EVENT, clearStoredAuthTokens } from "@/lib/auth-storage"
import {
  propertyCategories,
  type PropertyCategory,
} from "@/lib/property-categories"
import { cn } from "@/lib/utils"

type BreadcrumbItem = {
  href?: string
  label: string
}

const categoryIcons: Record<PropertyCategory["slug"], LucideIcon> = {
  agences: Building2,
  appartements: Landmark,
  bureaux: Warehouse,
  hotels: Hotel,
  immeubles: Building2,
  kiosques: Store,
  maisons: House,
  terrains: Map,
}

function initials(profile: AccountProfile) {
  const first = profile.first_name.at(0) ?? ""
  const last = profile.last_name.at(0) ?? ""

  return `${first}${last}`.toUpperCase() || profile.email.at(0)?.toUpperCase()
}

function dashboardRedirectPath() {
  const path = `${window.location.pathname}${window.location.search}`

  return path || "/dashboard"
}

function categoryHref(item: PropertyCategory) {
  if (item.slug === "agences") {
    return "/dashboard/agencies"
  }

  if (item.slug === "appartements") {
    return "/dashboard/appartements"
  }

  return `/dashboard#${item.slug}`
}

const categoryPathPrefixes: Partial<
  Record<PropertyCategory["slug"], string[]>
> = {
  agences: ["/dashboard/agencies"],
  appartements: ["/dashboard/appartements"],
}

function isCategoryActive(item: PropertyCategory, pathname: string) {
  return categoryPathPrefixes[item.slug]?.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function DashboardShellLoading({
  breadcrumbs,
  children,
  pathname,
  title,
}: {
  breadcrumbs: BreadcrumbItem[]
  children?: React.ReactNode
  pathname: string
  title: string
}) {
  const overviewIsActive = pathname === "/dashboard"

  return (
    <main className="flex min-h-svh bg-muted text-foreground">
      <aside className="sticky top-0 hidden h-svh w-72 shrink-0 border-r border-white/10 bg-brand-navy p-4 text-brand-white lg:block">
        <Link href="/" aria-label="Accueil Homelink" className="block shrink-0">
          <HomelinkLogo sizes="176px" className="h-14 w-44" />
        </Link>

        <nav aria-label="Navigation dashboard" className="mt-8 space-y-1">
          <Link
            href="/dashboard"
            aria-current={overviewIsActive ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition",
              overviewIsActive
                ? "bg-white/12 text-white"
                : "text-white/72 hover:bg-white/8 hover:text-white"
            )}
          >
            <LayoutDashboard className="size-4" />
            Vue d&apos;ensemble
          </Link>
          {propertyCategories.map((item) => {
            const Icon = categoryIcons[item.slug]
            const active = isCategoryActive(item, pathname)

            return (
              <Link
                key={item.slug}
                href={categoryHref(item)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition",
                  active
                    ? "bg-white/12 text-white"
                    : "text-white/72 hover:bg-white/8 hover:text-white"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 rounded-lg border border-white/10 bg-white/8 p-3 text-sm text-white/72">
          <p className="font-medium text-white">Homelink Admin</p>
          <p className="mt-1 leading-5">Gestion des biens et des categories.</p>
        </div>
      </aside>
      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="lg:hidden"
                disabled
              >
                <Menu />
              </Button>
              <div className="min-w-0">
                <nav
                  aria-label="Fil d'Ariane"
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                >
                  <Link href="/dashboard" className="hover:text-foreground">
                    Dashboard
                  </Link>
                  {breadcrumbs.map((item) => (
                    <React.Fragment key={`${item.href ?? ""}${item.label}`}>
                      <ChevronRight className="size-3" />
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="truncate hover:text-foreground"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span className="truncate text-foreground">
                          {item.label}
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
                <h1 className="mt-1 truncate text-lg font-semibold">{title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative hidden md:block">
                <label htmlFor="dashboard-search-loading" className="sr-only">
                  Rechercher
                </label>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="dashboard-search-loading"
                  type="search"
                  placeholder="Rechercher"
                  disabled
                  className="h-9 w-64 rounded-md border border-input bg-background pr-3 pl-9 text-sm transition outline-none placeholder:text-muted-foreground disabled:opacity-70"
                />
              </div>
              <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-2 text-card-foreground">
                <Skeleton className="size-7 rounded" />
                <span className="hidden text-sm font-medium text-muted-foreground sm:block">
                  Compte
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-9 gap-1.5 px-2 sm:px-3"
              >
                <Link href="/">
                  <Home />
                  <span className="hidden sm:inline">Accueil</span>
                </Link>
              </Button>
            </div>
          </div>
        </header>
        <div className="space-y-6 p-4 sm:p-6">
          {children ?? (
            <>
              <Skeleton className="h-28 w-full" />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
              <Skeleton className="h-80 w-full" />
            </>
          )}
        </div>
      </section>
    </main>
  )
}

function SidebarContent({
  onNavigate,
  pathname,
}: {
  onNavigate?: () => void
  pathname: string
}) {
  const overviewIsActive = pathname === "/dashboard"

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        aria-label="Accueil Homelink"
        className="shrink-0"
        onClick={onNavigate}
      >
        <HomelinkLogo sizes="176px" className="h-14 w-44" />
      </Link>

      <nav aria-label="Navigation dashboard" className="mt-8 space-y-1">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          aria-current={overviewIsActive ? "page" : undefined}
          className={cn(
            "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition",
            overviewIsActive
              ? "bg-white/12 text-white"
              : "text-white/72 hover:bg-white/8 hover:text-white"
          )}
        >
          <LayoutDashboard className="size-4" />
          Vue d&apos;ensemble
        </Link>
        {propertyCategories.map((item) => {
          const Icon = categoryIcons[item.slug]
          const active = isCategoryActive(item, pathname)

          return (
            <Link
              key={item.slug}
              href={categoryHref(item)}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition",
                active
                  ? "bg-white/12 text-white"
                  : "text-white/72 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-white/10 bg-white/8 p-3 text-sm text-white/72">
        <p className="font-medium text-white">Homelink Admin</p>
        <p className="mt-1 leading-5">Gestion des biens et des categories.</p>
      </div>
    </div>
  )
}

function DashboardShell({
  breadcrumbs = [{ label: "Vue d'ensemble" }],
  children,
  title = "Administration",
}: {
  breadcrumbs?: BreadcrumbItem[]
  children: React.ReactNode
  title?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const userMenuRef = React.useRef<HTMLDivElement>(null)
  const [profile, setProfile] = React.useState<AccountProfile | null>(null)
  const [checking, setChecking] = React.useState(true)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)

  const loadProfile = React.useCallback(async () => {
    setChecking(true)

    try {
      const nextProfile = await fetchCurrentAccountProfile()

      if (!nextProfile) {
        clearStoredAuthTokens()
        router.replace(
          `/login?next=${encodeURIComponent(dashboardRedirectPath())}`
        )
        return
      }

      setProfile(nextProfile)
    } finally {
      setChecking(false)
    }
  }, [router])

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile()
    }, 0)

    window.addEventListener(AUTH_STORAGE_EVENT, loadProfile)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(AUTH_STORAGE_EVENT, loadProfile)
    }
  }, [loadProfile])

  React.useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (
        userMenuRef.current &&
        event.target instanceof Node &&
        !userMenuRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  if (checking) {
    return (
      <DashboardShellLoading
        breadcrumbs={breadcrumbs}
        pathname={pathname}
        title={title}
      >
        {children}
      </DashboardShellLoading>
    )
  }

  if (!profile) {
    return (
      <DashboardShellLoading
        breadcrumbs={breadcrumbs}
        pathname={pathname}
        title={title}
      />
    )
  }

  async function logout() {
    clearStoredAuthTokens()
    setUserMenuOpen(false)
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null)
    router.replace("/login")
  }

  return (
    <main className="flex min-h-svh bg-muted text-foreground">
      <aside className="sticky top-0 hidden h-svh w-72 shrink-0 border-r border-white/10 bg-brand-navy p-4 text-brand-white lg:block">
        <SidebarContent pathname={pathname} />
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-brand-navy/60 transition lg:hidden",
          sidebarOpen ? "visible opacity-100" : "invisible opacity-0"
        )}
        aria-hidden="true"
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-white/10 bg-brand-navy p-4 text-brand-white transition-transform lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X />
          </Button>
        </div>
        <SidebarContent
          pathname={pathname}
          onNavigate={() => setSidebarOpen(false)}
        />
      </aside>

      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu />
              </Button>
              <div className="min-w-0">
                <nav
                  aria-label="Fil d'Ariane"
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                >
                  <Link href="/dashboard" className="hover:text-foreground">
                    Dashboard
                  </Link>
                  {breadcrumbs.map((item) => (
                    <React.Fragment key={`${item.href ?? ""}${item.label}`}>
                      <ChevronRight className="size-3" />
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="truncate hover:text-foreground"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span className="truncate text-foreground">
                          {item.label}
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
                <h1 className="mt-1 truncate text-lg font-semibold">{title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden md:block">
                <label htmlFor="dashboard-search" className="sr-only">
                  Rechercher
                </label>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="dashboard-search"
                  type="search"
                  placeholder="Rechercher"
                  className="h-9 w-64 rounded-md border border-input bg-background pr-3 pl-9 text-sm transition outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30"
                />
              </div>
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-2 text-card-foreground transition outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <span className="flex size-7 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">
                    {initials(profile)}
                  </span>
                  <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
                    {profile.first_name || profile.email}
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </button>

                <div
                  role="menu"
                  className={cn(
                    "absolute top-11 right-0 z-40 w-64 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg transition",
                    userMenuOpen
                      ? "visible translate-y-0 opacity-100"
                      : "invisible -translate-y-1 opacity-0"
                  )}
                >
                  <div className="border-b border-border p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                        {initials(profile)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {profile.first_name} {profile.last_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {profile.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-1">
                    <a
                      role="menuitem"
                      href={`mailto:${profile.email}`}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-muted"
                    >
                      {profile.email}
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
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-9 gap-1.5 px-2 sm:px-3"
              >
                <Link href="/">
                  <Home />
                  <span className="hidden sm:inline">Accueil</span>
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-4 sm:p-6">{children}</div>
      </section>
    </main>
  )
}

export { DashboardShell, categoryIcons }

"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
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
  Settings,
  Store,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react"
import * as React from "react"

import { HomelinkLogo } from "@/components/homelink-logo"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AUTH_STORAGE_EVENT, clearStoredAuthTokens } from "@/lib/auth-storage"
import { fetchCurrentAccountProfile } from "@/lib/account-client"
import type { AccountProfile } from "@/lib/account-profile"
import {
  propertyCategories,
  type PropertyCategory,
} from "@/lib/property-categories"
import { cn } from "@/lib/utils"

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

const stats = [
  { label: "Biens publies", value: "0", change: "A configurer" },
  { label: "Demandes actives", value: "0", change: "A connecter" },
  { label: "Agences", value: "0", change: "A synchroniser" },
  { label: "Visites", value: "0", change: "A suivre" },
]

function DashboardSkeleton() {
  return (
    <main className="flex min-h-svh bg-muted text-foreground">
      <aside className="hidden w-72 border-r border-border bg-brand-navy p-4 lg:block">
        <Skeleton className="h-12 w-40 bg-white/15" />
        <div className="mt-8 space-y-2">
          {propertyCategories.slice(0, 6).map((item) => (
            <Skeleton key={item.slug} className="h-10 w-full bg-white/15" />
          ))}
        </div>
      </aside>
      <section className="min-w-0 flex-1">
        <div className="border-b border-border bg-background px-4 py-4 sm:px-6">
          <Skeleton className="h-8 w-52" />
        </div>
        <div className="space-y-6 p-4 sm:p-6">
          <Skeleton className="h-28 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <Skeleton key={item.label} className="h-28 w-full" />
            ))}
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </section>
    </main>
  )
}

function initials(profile: AccountProfile) {
  const first = profile.first_name.at(0) ?? ""
  const last = profile.last_name.at(0) ?? ""

  return `${first}${last}`.toUpperCase() || profile.email.at(0)?.toUpperCase()
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link
        href="/dashboard"
        aria-label="Dashboard Homelink"
        className="shrink-0"
        onClick={onNavigate}
      >
        <HomelinkLogo sizes="176px" className="h-14 w-44" />
      </Link>

      <nav aria-label="Navigation dashboard" className="mt-8 space-y-1">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex h-10 items-center gap-2 rounded-md bg-white/12 px-3 text-sm font-medium text-white"
        >
          <LayoutDashboard className="size-4" />
          Vue d&apos;ensemble
        </Link>
        {propertyCategories.map((item) => {
          const Icon = categoryIcons[item.slug]

          return (
            <Link
              key={item.slug}
              href={`/dashboard#${item.slug}`}
              onClick={onNavigate}
              className="flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-white/72 transition hover:bg-white/8 hover:text-white"
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

function DashboardContent() {
  const router = useRouter()
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
        router.replace("/login?next=/dashboard")
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

  if (checking || !profile) {
    return <DashboardSkeleton />
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
        <SidebarContent />
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
        <SidebarContent onNavigate={() => setSidebarOpen(false)} />
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
                  <ChevronRight className="size-3" />
                  <span className="truncate text-foreground">
                    Vue d&apos;ensemble
                  </span>
                </nav>
                <h1 className="mt-1 truncate text-lg font-semibold">
                  Administration
                </h1>
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

        <div className="space-y-6 p-4 sm:p-6">
          <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Vue d&apos;ensemble
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Bonjour {profile.first_name || profile.email}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Espace d&apos;administration pour organiser les categories,
                  suivre les publications et preparer les prochains modules de
                  gestion.
                </p>
              </div>
              <Button asChild className="w-full xl:w-auto">
                <Link href="/dashboard#categories">Gerer les categories</Link>
              </Button>
            </div>
          </section>

          <section
            aria-label="Indicateurs"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {stats.map((item) => (
              <article
                key={item.label}
                className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm"
              >
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.change}
                </p>
              </article>
            ))}
          </section>

          <section
            id="categories"
            className="rounded-lg border border-border bg-card text-card-foreground shadow-sm"
          >
            <div className="border-b border-border p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Categories de biens</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Les memes entrees que la navigation principale, avec un
                    espace dedie pour les futurs modules.
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Nouvelle entree
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Categorie</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyCategories.map((item) => {
                    const Icon = categoryIcons[item.slug]

                    return (
                      <tr
                        key={item.slug}
                        id={item.slug}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-primary">
                              <Icon className="size-4" />
                            </span>
                            <span className="font-medium">{item.label}</span>
                          </div>
                        </td>
                        <td className="max-w-md px-4 py-4 text-muted-foreground">
                          {item.description}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                            En preparation
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button variant="outline" size="sm" disabled>
                            Ouvrir
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
            <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
              <h2 className="text-lg font-semibold">Activite recente</h2>
              <div className="mt-4 space-y-3">
                {[
                  "Connexion utilisateur",
                  "Chargement du profil",
                  "Dashboard pret",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between border-b border-border pb-3 text-sm last:border-b-0 last:pb-0"
                  >
                    <span>{item}</span>
                    <span className="text-muted-foreground">Maintenant</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex items-center gap-2">
                <Settings className="size-5 text-primary" />
                <h2 className="text-lg font-semibold">Configuration</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Les modules metier pourront etre branches ici au fur et a mesure
                que les endpoints deviennent disponibles.
              </p>
            </article>
          </section>
        </div>
      </section>
    </main>
  )
}

export { DashboardContent }

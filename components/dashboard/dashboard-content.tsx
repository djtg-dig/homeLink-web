"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2,
  Hotel,
  House,
  Landmark,
  LayoutDashboard,
  Map,
  Store,
  Warehouse,
} from "lucide-react"
import * as React from "react"

import { HomelinkLogo } from "@/components/homelink-logo"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AUTH_STORAGE_EVENT, clearStoredAuthTokens } from "@/lib/auth-storage"
import { fetchCurrentAccountProfile } from "@/lib/account-client"
import type { AccountProfile } from "@/lib/account-profile"
import { propertyCategories } from "@/lib/property-categories"

const categoryIcons = {
  agences: Building2,
  appartements: Landmark,
  bureaux: Warehouse,
  hotels: Hotel,
  immeubles: Building2,
  kiosques: Store,
  maisons: House,
  terrains: Map,
}

function DashboardSkeleton() {
  return (
    <main className="min-h-svh bg-muted px-4 py-5 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-12 w-36" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {propertyCategories.map((item) => (
            <Skeleton key={item.slug} className="h-36 w-full" />
          ))}
        </div>
      </div>
    </main>
  )
}

function DashboardContent() {
  const router = useRouter()
  const [profile, setProfile] = React.useState<AccountProfile | null>(null)
  const [checking, setChecking] = React.useState(true)

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

  if (checking || !profile) {
    return <DashboardSkeleton />
  }

  return (
    <main className="min-h-svh bg-muted text-foreground">
      <header className="border-b border-border bg-brand-navy text-brand-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-10">
          <Link href="/" aria-label="Accueil Homelink">
            <HomelinkLogo
              priority
              sizes="176px"
              className="h-12 w-40 sm:h-14 sm:w-44"
            />
          </Link>
          <Button
            asChild
            variant="outline"
            className="border-white/20 bg-white/8 text-white hover:bg-white/14 hover:text-white"
          >
            <Link href="/">Accueil</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 lg:px-10">
        <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Dashboard
              </p>
              <h1 className="mt-1 text-2xl font-semibold">
                Bonjour {profile.first_name || profile.email}
              </h1>
            </div>
            <div className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
              {profile.email}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <LayoutDashboard className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Categories</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {propertyCategories.map((item) => {
              const Icon = categoryIcons[item.slug]

              return (
                <article
                  key={item.slug}
                  id={item.slug}
                  className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm"
                >
                  <div className="mb-5 flex size-10 items-center justify-center rounded-md bg-secondary text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-base font-semibold">{item.label}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                  <Button className="mt-5 w-full" variant="outline" disabled>
                    Ouvrir
                  </Button>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}

export { DashboardContent }

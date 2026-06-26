"use client"

import Image from "next/image"
import Link from "next/link"
import { Building2, CheckCircle2, Mail, MapPin, Phone, RefreshCw, Search } from "lucide-react"
import * as React from "react"

import { SiteFooter } from "@/components/navigation/site-footer"
import { SiteHeader } from "@/components/navigation/site-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import {
  buildPublicAgenciesQuery,
  initialPublicAgencyFilters,
  parsePublicAgencies,
  publicAgencyAddressLabel,
  publicAgencyDetailPath,
  publicAgencyLogo,
  publicAgencyName,
  publicAgencyPropertiesLabel,
  publicAgencySortOptions,
  publicAgencyVerifiedLabel,
  type PublicAgenciesResponse,
  type PublicAgency,
  type PublicAgencyFilters,
} from "@/lib/public-agencies"
import { cn } from "@/lib/utils"

const inputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30"

function AgencyCard({ agency }: { agency: PublicAgency }) {
  const detailPath = publicAgencyDetailPath(agency)
  const logo = publicAgencyLogo(agency)
  const email = agency.email?.trim()
  const phone = agency.phone?.trim()

  return (
    <article className="flex h-full flex-col rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary text-primary sm:size-28">
          {logo ? (
            <Image
              src={logo}
              alt={publicAgencyName(agency)}
              fill
              unoptimized
              sizes="(min-width: 640px) 112px, 96px"
              className="object-contain p-2"
            />
          ) : (
            <Building2 className="size-10" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "rounded-md px-2 py-1 text-xs font-semibold",
                agency.is_verified
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {publicAgencyVerifiedLabel(agency)}
            </span>
            <span className="rounded-md bg-brand-orange px-2 py-1 text-xs font-semibold text-brand-navy">
              {publicAgencyPropertiesLabel(agency)}
            </span>
          </div>
          <h2 className="mt-2 line-clamp-2 text-lg leading-snug font-semibold">
            {publicAgencyName(agency)}
          </h2>
        </div>
      </div>

      <p className="mt-5 flex gap-2 text-sm leading-6 text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
        <span className="line-clamp-2">{publicAgencyAddressLabel(agency)}</span>
      </p>

      <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
        {email ? (
          <a href={`mailto:${email}`} className="flex min-w-0 items-center gap-2 hover:text-primary">
            <Mail className="size-4 shrink-0" />
            <span className="truncate">{email}</span>
          </a>
        ) : null}
        {phone ? (
          <a href={`tel:${phone}`} className="flex min-w-0 items-center gap-2 hover:text-primary">
            <Phone className="size-4 shrink-0" />
            <span className="truncate">{phone}</span>
          </a>
        ) : null}
      </div>

      <div className="mt-auto pt-5">
        {detailPath ? (
          <Button asChild className="w-full">
            <Link href={detailPath}>Voir l’agence</Link>
          </Button>
        ) : (
          <Button className="w-full" disabled>
            Voir l’agence
          </Button>
        )}
      </div>
    </article>
  )
}

function AgenciesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex gap-4">
            <Skeleton className="size-24 shrink-0 sm:size-28" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-6 w-4/5" />
            </div>
          </div>
          <Skeleton className="mt-4 h-12 w-full" />
          <Skeleton className="mt-5 h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

function PublicAgenciesContent() {
  const [agencies, setAgencies] = React.useState<PublicAgency[]>([])
  const [count, setCount] = React.useState(0)
  const [draftFilters, setDraftFilters] = React.useState<PublicAgencyFilters>(
    initialPublicAgencyFilters
  )
  const [filters, setFilters] = React.useState<PublicAgencyFilters>(
    initialPublicAgencyFilters
  )
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const query = React.useMemo(() => buildPublicAgenciesQuery(filters), [filters])

  const loadAgencies = React.useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)

      try {
        const response = await apiFetch<PublicAgenciesResponse>(
          query ? `/api/agencies/public/?${query}` : "/api/agencies/public/",
          { signal }
        )
        const parsed = parsePublicAgencies(response)

        if (signal?.aborted) {
          return
        }

        setAgencies(parsed.agencies)
        setCount(parsed.count)
        setError("")
      } catch (caughtError) {
        if (signal?.aborted) {
          return
        }

        const fallback = "Chargement des agences impossible."

        if (caughtError instanceof ApiError) {
          setError(formatApiMessage(caughtError.body, fallback))
        } else {
          setError(caughtError instanceof Error ? caughtError.message : fallback)
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [query]
  )

  React.useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadAgencies(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadAgencies])

  function updateFilter(name: keyof PublicAgencyFilters, value: string) {
    setDraftFilters((current) => ({ ...current, [name]: value }))
  }

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilters(draftFilters)
  }

  function resetFilters() {
    setDraftFilters(initialPublicAgencyFilters)
    setFilters(initialPublicAgencyFilters)
  }

  return (
    <>
      <SiteHeader activeCategory="agences" />
      <main className="min-h-svh bg-background text-foreground">
        <section className="bg-muted/40 px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-medium text-primary">Agences Homelink</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Trouver une agence immobilière
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Consultez les agences actives, leurs coordonnées et leur portefeuille de biens.
            </p>
          </div>
        </section>

        <section className="px-4 py-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-6">
            <form
              onSubmit={applyFilters}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]">
                <label className="relative">
                  <span className="sr-only">Recherche</span>
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className={`${inputClassName} pl-9`}
                    value={draftFilters.search}
                    placeholder="Nom, ville, téléphone..."
                    onChange={(event) => updateFilter("search", event.target.value)}
                  />
                </label>

                <select
                  className={inputClassName}
                  value={draftFilters.is_verified || "all"}
                  onChange={(event) =>
                    updateFilter(
                      "is_verified",
                      event.target.value === "all" ? "" : event.target.value
                    )
                  }
                >
                  <option value="all">Toutes</option>
                  <option value="true">Vérifiées</option>
                  <option value="false">Non vérifiées</option>
                </select>

                <select
                  className={inputClassName}
                  value={draftFilters.sort_by}
                  onChange={(event) => updateFilter("sort_by", event.target.value)}
                >
                  {publicAgencySortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Rechercher
                  </Button>
                  <Button type="button" variant="outline" onClick={resetFilters}>
                    Effacer
                  </Button>
                </div>
              </div>
            </form>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {loading ? "Recherche en cours..." : `${count} agence${count > 1 ? "s" : ""}`}
              </p>
              <Button type="button" variant="outline" onClick={() => void loadAgencies()} disabled={loading}>
                <RefreshCw className={cn(loading && "animate-spin")} />
                Actualiser
              </Button>
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {loading ? <AgenciesSkeleton /> : null}

            {!loading && agencies.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {agencies.map((agency, index) => (
                  <AgencyCard key={String(agency.id ?? agency.slug ?? index)} agency={agency} />
                ))}
              </div>
            ) : null}

            {!loading && !error && agencies.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
                <span className="mx-auto flex size-12 items-center justify-center rounded-md bg-secondary text-primary">
                  <CheckCircle2 className="size-6" />
                </span>
                <h2 className="mt-4 text-lg font-semibold">Aucune agence trouvée</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ajustez la recherche ou revenez plus tard.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

export { PublicAgenciesContent }

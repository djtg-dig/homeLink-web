"use client"

import Link from "next/link"
import { ArrowLeft, Home, RefreshCw, Sparkles } from "lucide-react"
import * as React from "react"

import { HouseAiSearch } from "@/components/home/house-ai-search"
import {
  PublicPropertyCard,
  PublicResultsSkeleton,
} from "@/components/home/public-property-card"
import { SiteFooter } from "@/components/navigation/site-footer"
import { SiteHeader } from "@/components/navigation/site-header"
import { Button } from "@/components/ui/button"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import {
  buildHouseAiQuery,
  houseAiFilterLabels,
  type HouseAiFilters,
} from "@/lib/house-ai-search"
import {
  parsePublicImmovables,
  type PublicImmovable,
  type PublicImmovablesResponse,
} from "@/lib/public-immovables"
import { cn } from "@/lib/utils"

function safeErrorMessage(message: string, fallback: string) {
  const normalizedMessage = message.trim()

  return normalizedMessage.startsWith("<") ? fallback : normalizedMessage
}

function HouseAiResultsContent({
  filters,
  query,
}: {
  filters: HouseAiFilters
  query: string
}) {
  const [count, setCount] = React.useState(0)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [properties, setProperties] = React.useState<PublicImmovable[]>([])
  const filterQuery = React.useMemo(() => buildHouseAiQuery(filters), [filters])
  const filterLabels = React.useMemo(
    () => houseAiFilterLabels(filters),
    [filters]
  )

  const loadProperties = React.useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)

      try {
        const queryString = [
          filterQuery,
          query ? `search=${encodeURIComponent(query)}` : "",
        ]
          .filter(Boolean)
          .join("&")

        const response = await apiFetch<PublicImmovablesResponse>(
          `/api/immovables/public/maisons/${queryString ? `?${queryString}` : ""}`,
          { signal }
        )
        const parsed = parsePublicImmovables(response)

        if (signal?.aborted) {
          return
        }

        setProperties(parsed.properties)
        setCount(parsed.count)
        setError("")
      } catch (caughtError) {
        if (signal?.aborted) {
          return
        }

        const fallback = "Chargement des maisons impossible."

        if (caughtError instanceof ApiError) {
          setError(
            safeErrorMessage(
              formatApiMessage(caughtError.body, fallback),
              fallback
            )
          )
        } else {
          setError(
            safeErrorMessage(
              caughtError instanceof Error ? caughtError.message : fallback,
              fallback
            )
          )
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [filterQuery, query]
  )

  React.useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadProperties(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadProperties])

  return (
    <>
      <SiteHeader activeCategory="maisons" />
      <main className="min-h-svh bg-muted/35 text-foreground">
        <section className="border-b border-white/10 bg-brand-navy text-white">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="-ml-2 text-white/75 hover:bg-white/10 hover:text-white"
            >
              <Link href="/">
                <ArrowLeft />
                Retour à l’accueil
              </Link>
            </Button>

            <div className="mt-6 flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand-orange text-brand-navy">
                <Sparkles className="size-5" />
              </span>
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold sm:text-3xl">
                  Résultats de votre recherche
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/72 sm:text-base">
                  « {query} »
                </p>
              </div>
            </div>

            {filterLabels.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {filterLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-md border border-white/15 bg-white/8 px-2.5 py-1.5 text-xs font-medium text-white/85"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold sm:text-2xl">
                  Maisons correspondantes
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {loading
                    ? "Chargement en cours..."
                    : `${count} résultat${count === 1 ? "" : "s"}`}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => void loadProperties()}
                disabled={loading}
              >
                <RefreshCw className={cn(loading && "animate-spin")} />
                Actualiser
              </Button>
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
                <p className="font-medium">
                  Oups, impossible d’afficher les maisons.
                </p>
                <p className="mt-1 text-destructive/80">{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => void loadProperties()}
                >
                  <RefreshCw />
                  Réessayer
                </Button>
              </div>
            ) : loading ? (
              <PublicResultsSkeleton />
            ) : properties.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => (
                  <PublicPropertyCard
                    key={
                      property.id ?? property.reference ?? property.detail_url
                    }
                    property={property}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-background px-5 py-10 text-center">
                <Home className="mx-auto size-9 text-primary" />
                <h2 className="mt-3 text-xl font-semibold">
                  Aucune maison ne correspond
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Essayez une recherche plus large ou modifiez certains
                  critères.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <HouseAiSearch initialQuery={query} />
      <SiteFooter />
    </>
  )
}

export { HouseAiResultsContent }

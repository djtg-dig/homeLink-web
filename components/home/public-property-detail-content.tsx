"use client"

import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Home,
  Hotel,
  MapPin,
  RefreshCw,
  Store,
  X,
} from "lucide-react"
import * as React from "react"

import { SiteFooter } from "@/components/navigation/site-footer"
import { SiteHeader } from "@/components/navigation/site-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import {
  publicImmovableAddressLabel,
  publicImmovableAmenityLabels,
  publicImmovableDetailRows,
  publicImmovableHighlights,
  publicImmovableImage,
  publicImmovablePriceLabel,
  publicImmovableReferenceLabel,
  publicImmovableStatusLabel,
  publicImmovableTitle,
  publicImmovableTransactionLabel,
  publicImmovableType,
  publicImmovableTypeLabel,
  type PublicImmovable,
} from "@/lib/public-immovables"
import { cn } from "@/lib/utils"

function safeErrorMessage(message: string, fallback: string) {
  const normalizedMessage = message.trim()

  return normalizedMessage.startsWith("<") ? fallback : normalizedMessage
}

function PropertyIcon({ type }: { type?: string | null }) {
  const className = "size-10"

  if (type === "hotel") {
    return <Hotel className={className} />
  }

  if (type === "kiosque") {
    return <Store className={className} />
  }

  if (type === "maison" || type === "appartement") {
    return <Home className={className} />
  }

  return <Building2 className={className} />
}

function DetailSkeleton() {
  return (
    <>
      <main className="min-h-svh overflow-x-hidden bg-background text-foreground">
        <SiteHeader />
        <section className="px-4 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-6">
            <Skeleton className="h-10 w-40" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
              <Skeleton className="aspect-[4/3] rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-12 w-4/5" />
                <Skeleton className="h-5 w-2/3" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-20 rounded-lg" />
                  <Skeleton className="h-20 rounded-lg" />
                  <Skeleton className="h-20 rounded-lg" />
                  <Skeleton className="h-20 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

function SummaryItem({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  )
}

function CharacteristicValueCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 font-semibold break-words text-foreground">
        {value}
      </p>
    </div>
  )
}

function BooleanCharacteristicBadge({
  active,
  label,
}: {
  active: boolean
  label: string
}) {
  return (
    <span
      aria-label={`${label}: ${active ? "disponible" : "non disponible"}`}
      className={cn(
        "inline-flex min-h-9 w-full max-w-full items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium sm:w-auto",
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-border bg-muted/45 text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full",
          active
            ? "bg-emerald-100 text-emerald-700"
            : "bg-background text-muted-foreground"
        )}
      >
        {active ? (
          <CheckCircle2 className="size-3.5" />
        ) : (
          <X className="size-3.5" />
        )}
      </span>
      <span className="break-words">{label}</span>
    </span>
  )
}

function PublicPropertyDetailContent({ id }: { id: string }) {
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [property, setProperty] = React.useState<PublicImmovable | null>(null)

  const loadProperty = React.useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)

      try {
        const response = await apiFetch<PublicImmovable>(
          `/api/immovables/public/${encodeURIComponent(id)}/`,
          { signal }
        )

        if (signal?.aborted) {
          return
        }

        setProperty(response)
        setError("")
      } catch (caughtError) {
        if (signal?.aborted) {
          return
        }

        const fallback = "Chargement du bien impossible."

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
    [id]
  )

  React.useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadProperty(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadProperty])

  if (loading) {
    return <DetailSkeleton />
  }

  if (error || !property) {
    return (
      <>
        <main className="min-h-svh overflow-x-hidden bg-background text-foreground">
          <SiteHeader />
          <section className="px-4 py-8 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-3xl rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-destructive">
              <p className="text-lg font-semibold">
                Oups, impossible d’afficher ce bien.
              </p>
              <p className="mt-2 text-sm text-destructive/80">
                {error || "Le bien demandé est introuvable."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href="/#biens">
                    <ArrowLeft />
                    Retour aux biens
                  </Link>
                </Button>
                <Button type="button" onClick={() => void loadProperty()}>
                  <RefreshCw />
                  Réessayer
                </Button>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </>
    )
  }

  const image = publicImmovableImage(property)
  const amenities = publicImmovableAmenityLabels(property)
  const rows = publicImmovableDetailRows(property)
  const highlights = publicImmovableHighlights(property)
  const booleanRows = rows.filter((row) => row.kind === "boolean")
  const valueRows = rows.filter((row) => row.kind === "value")
  const activeBooleanCount = booleanRows.filter((row) => row.active).length

  return (
    <>
      <main className="min-h-svh overflow-x-hidden bg-background text-foreground">
        <SiteHeader />

        <section className="bg-muted/40 px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-6">
            <Button asChild variant="outline" className="bg-background">
              <Link href="/#biens">
                <ArrowLeft />
                Retour aux biens
              </Link>
            </Button>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] lg:items-start">
              <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <div className="relative aspect-[4/3] bg-secondary text-primary">
                  {image ? (
                    <Image
                      src={image}
                      alt={publicImmovableTitle(property)}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 60vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#e9f8ff,#ffffff)]">
                      <PropertyIcon type={publicImmovableType(property)} />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md bg-brand-navy px-2 py-1 text-xs font-semibold text-white">
                      {publicImmovableTypeLabel(property)}
                    </span>
                    <span className="rounded-md bg-brand-orange px-2 py-1 text-xs font-semibold text-brand-navy">
                      {publicImmovableTransactionLabel(property)}
                    </span>
                    <span className="rounded-md bg-background px-2 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border">
                      {publicImmovableStatusLabel(property)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {publicImmovableReferenceLabel(property)}
                    </p>
                    <h1 className="mt-2 text-3xl leading-tight font-semibold break-words sm:text-4xl">
                      {publicImmovableTitle(property)}
                    </h1>
                  </div>
                  <p className="flex gap-2 text-sm leading-6 text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{publicImmovableAddressLabel(property)}</span>
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryItem
                    label="Prix"
                    value={publicImmovablePriceLabel(property)}
                  />
                  <SummaryItem
                    label="Transaction"
                    value={publicImmovableTransactionLabel(property)}
                  />
                  <SummaryItem
                    label="Statut"
                    value={publicImmovableStatusLabel(property)}
                  />
                  <SummaryItem
                    label="Type de bien"
                    value={publicImmovableTypeLabel(property)}
                  />
                </div>

                {highlights.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Description</h2>
              <p className="mt-3 text-sm leading-7 whitespace-pre-line text-muted-foreground">
                {property.description || "Description à compléter."}
              </p>
            </article>

            <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Atouts</h2>
              {amenities.length > 0 ? (
                <div className="mt-4 grid gap-2">
                  {amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="size-4 shrink-0 text-primary" />
                      {amenity}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Aucun atout spécifique n’a encore été renseigné.
                </p>
              )}
            </article>
          </div>
        </section>

        {rows.length > 0 ? (
          <section className="bg-muted/40 px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
            <div className="mx-auto max-w-6xl space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">
                    Détails du bien
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    Caractéristiques
                  </h2>
                </div>
                <span className="w-fit rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground">
                  {rows.length} élément{rows.length > 1 ? "s" : ""}
                </span>
              </div>

              {valueRows.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {valueRows.map((row) => (
                    <CharacteristicValueCard
                      key={`${row.label}-${row.value}`}
                      label={row.label}
                      value={row.value}
                    />
                  ))}
                </div>
              ) : null}

              {booleanRows.length > 0 ? (
                <div className="rounded-lg border border-border bg-background p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold">
                        Équipements et options
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activeBooleanCount} actif
                        {activeBooleanCount > 1 ? "s" : ""} sur{" "}
                        {booleanRows.length}
                      </p>
                    </div>
                    <span className="w-fit rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold text-primary">
                      Options
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {booleanRows.map((row) => (
                      <BooleanCharacteristicBadge
                        key={`${row.label}-${row.active}`}
                        active={row.active}
                        label={row.label}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  )
}

export { PublicPropertyDetailContent }

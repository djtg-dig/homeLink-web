"use client"

import * as React from "react"
import Link from "next/link"
import {
  BedDouble,
  CheckCircle2,
  Hotel,
  MapPin,
  Plus,
  RefreshCw,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  createdDateLabel,
  hotelAddressLabel,
  hotelDisplayName,
  hotelId,
  hotelReferenceLabel,
  hotelTypeLabel,
  parseHotels,
  priceLabel,
  roomLabel,
  standingLabel,
  statusLabel,
  surfaceLabel,
  transactionLabel,
  type Hotel as HotelItem,
  type HotelsResponse,
} from "@/lib/hotels"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

function HotelsTableSkeleton() {
  return Array.from({ length: 4 }).map((_, index) => (
    <tr key={index} className="border-b border-border last:border-b-0">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-3 w-24" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-3 w-16" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-56" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-7 w-28 rounded-md" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-24" />
      </td>
    </tr>
  ))
}

function StatusPill({
  active,
  children,
}: {
  active: boolean
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        active
          ? "bg-emerald-100 text-emerald-700"
          : "bg-muted text-muted-foreground"
      )}
    >
      {children}
    </span>
  )
}

function numericValue(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === "string") {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function HotelsContent() {
  const [hotels, setHotels] = React.useState<HotelItem[]>([])
  const [count, setCount] = React.useState(0)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const activeCount = React.useMemo(
    () => hotels.filter((hotel) => hotel.is_active !== false).length,
    [hotels]
  )
  const operationalCount = React.useMemo(
    () =>
      hotels.filter((hotel) => hotel.hotel?.is_operational !== false).length,
    [hotels]
  )
  const roomsCount = React.useMemo(
    () =>
      hotels.reduce(
        (total, hotel) => total + numericValue(hotel.hotel?.nombre_chambres),
        0
      ),
    [hotels]
  )

  const loadHotels = React.useCallback(async (signal?: AbortSignal) => {
    setLoading(true)

    try {
      const response = await apiFetch<HotelsResponse>(
        "/api/immovables/hotels/",
        { signal }
      )
      const parsed = parseHotels(response)

      if (signal?.aborted) {
        return
      }

      setHotels(parsed.hotels)
      setCount(parsed.count)
      setError("")
    } catch (caughtError) {
      if (signal?.aborted) {
        return
      }

      if (caughtError instanceof ApiError) {
        setError(
          formatApiMessage(
            caughtError.body,
            "Chargement des hôtels impossible."
          )
        )
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Chargement des hôtels impossible."
        )
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  React.useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadHotels(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadHotels])

  function reloadHotels() {
    void loadHotels()
  }

  return (
    <DashboardShell title="Hôtels" breadcrumbs={[{ label: "Hôtels" }]}>
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Gestion des hôtels
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Hôtels entiers</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Créez et suivez les hôtels gérés comme biens immobiliers entiers.
            </p>
          </div>
          <Button asChild className="h-10 w-full lg:w-auto">
            <Link href="/dashboard/hotels/new">
              <Plus />
              Créer un hôtel
            </Link>
          </Button>
        </div>
      </section>

      <section
        aria-label="Indicateurs hôtels"
        className="grid gap-4 md:grid-cols-4"
      >
        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Total hôtels</p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-3 text-3xl font-semibold">{count}</p>
          )}
        </article>
        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Actifs</p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-3 text-3xl font-semibold">{activeCount}</p>
          )}
        </article>
        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Opérationnels</p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-3 text-3xl font-semibold">{operationalCount}</p>
          )}
        </article>
        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Chambres</p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-3 text-3xl font-semibold">{roomsCount}</p>
          )}
        </article>
      </section>

      <section className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Liste des hôtels</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Consultez les hôtels créés sur la plateforme.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={reloadHotels}
            disabled={loading}
          >
            <RefreshCw className={cn(loading && "animate-spin")} />
            Actualiser
          </Button>
        </div>

        {error ? (
          <div className="m-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Hôtel</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Prix</th>
                <th className="px-4 py-3 font-medium">Adresse</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Capacité</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <HotelsTableSkeleton /> : null}

              {!loading && hotels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <div className="mx-auto flex max-w-md flex-col items-center text-center">
                      <span className="flex size-12 items-center justify-center rounded-md bg-secondary text-primary">
                        <Hotel className="size-6" />
                      </span>
                      <h3 className="mt-4 text-base font-semibold">
                        Aucun hôtel pour le moment
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Créez un hôtel pour alimenter cette liste.
                      </p>
                      <Button asChild className="mt-4">
                        <Link href="/dashboard/hotels/new">
                          <Plus />
                          Créer un hôtel
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!loading
                ? hotels.map((hotel, index) => {
                    const id = hotelId(hotel)
                    const key = id || `${hotel.title}-${index}`

                    return (
                      <tr
                        key={key}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                              <Hotel className="size-5" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {hotelDisplayName(hotel)}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {hotelReferenceLabel(hotel)} ·{" "}
                                {createdDateLabel(hotel.created_at)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {hotelTypeLabel(hotel.hotel?.hotel_type)}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {standingLabel(hotel.hotel?.standing)} ·{" "}
                            {surfaceLabel(hotel.surface_totale)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-medium">
                            {priceLabel(hotel)}
                          </span>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {transactionLabel(hotel.type_transaction)}
                          </p>
                        </td>
                        <td className="max-w-80 px-4 py-4 text-muted-foreground">
                          <span className="flex items-start gap-1.5">
                            <MapPin className="mt-0.5 size-3.5 shrink-0" />
                            <span className="line-clamp-2">
                              {hotelAddressLabel(hotel)}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <StatusPill active={hotel.statut === "disponible"}>
                              {statusLabel(hotel.statut)}
                            </StatusPill>
                            <StatusPill
                              active={hotel.hotel?.is_operational !== false}
                            >
                              <CheckCircle2 className="mr-1 size-3" />
                              {hotel.hotel?.is_operational === false
                                ? "Fermé"
                                : "Opérationnel"}
                            </StatusPill>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5">
                            <BedDouble className="size-4 text-muted-foreground" />
                            {roomLabel(hotel.hotel?.nombre_chambres)}
                          </span>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {hotel.hotel?.nombre_lits_total ?? "-"} lits
                          </p>
                        </td>
                      </tr>
                    )
                  })
                : null}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  )
}

export { HotelsContent }

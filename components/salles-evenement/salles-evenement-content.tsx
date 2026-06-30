"use client"

import * as React from "react"
import Link from "next/link"
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  Plus,
  RefreshCw,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  capacityLabel,
  createdDateLabel,
  parseSallesEvenement,
  priceLabel,
  salleEvenementAddressLabel,
  salleEvenementDisplayName,
  salleEvenementId,
  salleEvenementReferenceLabel,
  salleTypeLabel,
  statusLabel,
  surfaceLabel,
  transactionLabel,
  type SalleEvenement,
  type SallesEvenementResponse,
} from "@/lib/salles-evenement"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

function SallesEvenementTableSkeleton() {
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
      <td className="hidden px-4 py-4 md:table-cell">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-3 w-24" />
      </td>
      <td className="hidden px-4 py-4 sm:table-cell">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-3 w-16" />
      </td>
      <td className="hidden px-4 py-4 xl:table-cell">
        <Skeleton className="h-4 w-56" />
      </td>
      <td className="hidden px-4 py-4 lg:table-cell">
        <Skeleton className="h-7 w-28 rounded-md" />
      </td>
      <td className="hidden px-4 py-4 lg:table-cell">
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

function SallesEvenementContent() {
  const [salles, setSalles] = React.useState<SalleEvenement[]>([])
  const [count, setCount] = React.useState(0)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const activeCount = React.useMemo(
    () => salles.filter((salle) => salle.is_active !== false).length,
    [salles]
  )
  const availableCount = React.useMemo(
    () => salles.filter((salle) => salle.statut === "disponible").length,
    [salles]
  )
  const totalCapacity = React.useMemo(
    () =>
      salles.reduce(
        (total, salle) =>
          total + numericValue(salle.salle_evenement?.capacite_max),
        0
      ),
    [salles]
  )

  const loadSalles = React.useCallback(async (signal?: AbortSignal) => {
    setLoading(true)

    try {
      const response = await apiFetch<SallesEvenementResponse>(
        "/api/immovables/salles-evenement/",
        { signal }
      )
      const parsed = parseSallesEvenement(response)

      if (signal?.aborted) {
        return
      }

      setSalles(parsed.salles)
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
            "Chargement des salles impossible."
          )
        )
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Chargement des salles impossible."
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
      void loadSalles(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadSalles])

  function reloadSalles() {
    void loadSalles()
  }

  return (
    <DashboardShell
      title="Salles événement"
      breadcrumbs={[{ label: "Salles événement" }]}
    >
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Gestion des salles
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Salles d&apos;événement
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Créez et suivez les salles disponibles pour mariages, conférences,
              réunions et spectacles.
            </p>
          </div>
          <Button asChild className="h-10 w-full lg:w-auto">
            <Link href="/dashboard/salles-evenement/new">
              <Plus />
              Créer une salle
            </Link>
          </Button>
        </div>
      </section>

      <section
        aria-label="Indicateurs salles"
        className="grid gap-4 md:grid-cols-4"
      >
        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Total salles</p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-3 text-3xl font-semibold">{count}</p>
          )}
        </article>
        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Disponibles</p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-3 text-3xl font-semibold">{availableCount}</p>
          )}
        </article>
        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Actives</p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-3 text-3xl font-semibold">{activeCount}</p>
          )}
        </article>
        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Capacité totale</p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-3 text-3xl font-semibold">{totalCapacity}</p>
          )}
        </article>
      </section>

      <section className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Liste des salles</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Consultez les salles créées sur la plateforme.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={reloadSalles}
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
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Salle</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">
                  Type
                </th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">
                  Prix
                </th>
                <th className="hidden px-4 py-3 font-medium xl:table-cell">
                  Adresse
                </th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">
                  Statut
                </th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">
                  Capacité
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? <SallesEvenementTableSkeleton /> : null}

              {!loading && salles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <div className="mx-auto flex max-w-md flex-col items-center text-center">
                      <span className="flex size-12 items-center justify-center rounded-md bg-secondary text-primary">
                        <CalendarDays className="size-6" />
                      </span>
                      <h3 className="mt-4 text-base font-semibold">
                        Aucune salle pour le moment
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Créez une salle pour alimenter cette liste.
                      </p>
                      <Button asChild className="mt-4">
                        <Link href="/dashboard/salles-evenement/new">
                          <Plus />
                          Créer une salle
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!loading
                ? salles.map((salle, index) => {
                    const id = salleEvenementId(salle)
                    const key = id || `${salle.title}-${index}`

                    return (
                      <tr
                        key={key}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="min-w-0 px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                              <CalendarDays className="size-5" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {salleEvenementDisplayName(salle)}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {salleEvenementReferenceLabel(salle)} ·
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {createdDateLabel(salle.created_at)}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground sm:hidden">
                                {priceLabel(salle)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-4 md:table-cell">
                          {salleTypeLabel(salle.salle_evenement?.salle_type)}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {surfaceLabel(salle.salle_evenement?.surface_salle)}{" "}
                            · {salle.salle_evenement?.nombre_salles ?? "-"}{" "}
                            salles
                          </p>
                        </td>
                        <td className="hidden px-4 py-4 sm:table-cell">
                          <span className="font-medium">
                            {priceLabel(salle)}
                          </span>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {transactionLabel(salle.type_transaction)}
                          </p>
                        </td>
                        <td className="hidden max-w-80 px-4 py-4 text-muted-foreground xl:table-cell">
                          <span className="flex items-start gap-1.5">
                            <MapPin className="mt-0.5 size-3.5 shrink-0" />
                            <span className="line-clamp-2">
                              {salleEvenementAddressLabel(salle)}
                            </span>
                          </span>
                        </td>
                        <td className="hidden px-4 py-4 lg:table-cell">
                          <div className="flex flex-wrap gap-2">
                            <StatusPill active={salle.statut === "disponible"}>
                              {statusLabel(salle.statut)}
                            </StatusPill>
                            <StatusPill active={salle.is_active !== false}>
                              <CheckCircle2 className="mr-1 size-3" />
                              {salle.is_active === false
                                ? "Inactive"
                                : "Active"}
                            </StatusPill>
                          </div>
                        </td>
                        <td className="hidden px-4 py-4 lg:table-cell">
                          {capacityLabel(salle.salle_evenement?.capacite_max)}
                          <p className="mt-1 text-xs text-muted-foreground">
                            Total {surfaceLabel(salle.surface_totale)}
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

export { SallesEvenementContent }

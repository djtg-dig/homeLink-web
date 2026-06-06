"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2, Map, MapPin, Plus, RefreshCw } from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  agencyName,
  createdDateLabel,
  parseTerrains,
  priceLabel,
  statusLabel,
  surfaceLabel,
  terrainAddressLabel,
  terrainDisplayName,
  terrainId,
  terrainReferenceLabel,
  terrainTypeLabel,
  topographyLabel,
  transactionLabel,
  type Terrain,
  type TerrainsResponse,
} from "@/lib/terrains"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

function TerrainsTableSkeleton() {
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

function TerrainsContent() {
  const [terrains, setTerrains] = React.useState<Terrain[]>([])
  const [count, setCount] = React.useState(0)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const activeCount = React.useMemo(
    () => terrains.filter((terrain) => terrain.is_active !== false).length,
    [terrains]
  )
  const availableCount = React.useMemo(
    () => terrains.filter((terrain) => terrain.statut === "disponible").length,
    [terrains]
  )
  const totalSurface = React.useMemo(
    () =>
      terrains.reduce(
        (total, terrain) =>
          total + numericValue(terrain.terrain?.surface_terrain),
        0
      ),
    [terrains]
  )

  const loadTerrains = React.useCallback(async (signal?: AbortSignal) => {
    setLoading(true)

    try {
      const response = await apiFetch<TerrainsResponse>(
        "/api/immovables/terrains/",
        { signal }
      )
      const parsed = parseTerrains(response)

      if (signal?.aborted) {
        return
      }

      setTerrains(parsed.terrains)
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
            "Chargement des terrains impossible."
          )
        )
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Chargement des terrains impossible."
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
      void loadTerrains(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadTerrains])

  function reloadTerrains() {
    void loadTerrains()
  }

  return (
    <DashboardShell title="Terrains" breadcrumbs={[{ label: "Terrains" }]}>
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Gestion des terrains
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Terrains et foncier</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Créez et suivez les terrains avec leur surface, leur topographie,
              leur adresse et leur agence éventuelle.
            </p>
          </div>
          <Button asChild className="h-10 w-full lg:w-auto">
            <Link href="/dashboard/terrains/new">
              <Plus />
              Créer un terrain
            </Link>
          </Button>
        </div>
      </section>

      <section
        aria-label="Indicateurs terrains"
        className="grid gap-4 md:grid-cols-4"
      >
        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Total terrains</p>
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
          <p className="text-sm text-muted-foreground">Actifs</p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-3 text-3xl font-semibold">{activeCount}</p>
          )}
        </article>
        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Surface foncière</p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-3 text-3xl font-semibold">
              {totalSurface.toLocaleString("fr-FR")}
            </p>
          )}
        </article>
      </section>

      <section className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Liste des terrains</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Consultez les terrains créés sur la plateforme.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={reloadTerrains}
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
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Terrain</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Prix</th>
                <th className="px-4 py-3 font-medium">Adresse</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Surface</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <TerrainsTableSkeleton /> : null}

              {!loading && terrains.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <div className="mx-auto flex max-w-md flex-col items-center text-center">
                      <span className="flex size-12 items-center justify-center rounded-md bg-secondary text-primary">
                        <Map className="size-6" />
                      </span>
                      <h3 className="mt-4 text-base font-semibold">
                        Aucun terrain pour le moment
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Créez un terrain pour alimenter cette liste.
                      </p>
                      <Button asChild className="mt-4">
                        <Link href="/dashboard/terrains/new">
                          <Plus />
                          Créer un terrain
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!loading
                ? terrains.map((terrain, index) => {
                    const id = terrainId(terrain)
                    const key = id || `${terrain.title}-${index}`

                    return (
                      <tr
                        key={key}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                              <Map className="size-5" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {terrainDisplayName(terrain)}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {terrainReferenceLabel(terrain)} ·{" "}
                                {createdDateLabel(terrain.created_at)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {terrainTypeLabel(terrain.terrain?.terrain_type)}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {topographyLabel(terrain.terrain?.topography)} ·{" "}
                            {agencyName(terrain)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-medium">
                            {priceLabel(terrain)}
                          </span>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {transactionLabel(terrain.type_transaction)}
                          </p>
                        </td>
                        <td className="max-w-80 px-4 py-4 text-muted-foreground">
                          <span className="flex items-start gap-1.5">
                            <MapPin className="mt-0.5 size-3.5 shrink-0" />
                            <span className="line-clamp-2">
                              {terrainAddressLabel(terrain)}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <StatusPill
                              active={terrain.statut === "disponible"}
                            >
                              {statusLabel(terrain.statut)}
                            </StatusPill>
                            <StatusPill active={terrain.is_active !== false}>
                              <CheckCircle2 className="mr-1 size-3" />
                              {terrain.is_active === false
                                ? "Inactif"
                                : "Actif"}
                            </StatusPill>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {surfaceLabel(terrain.terrain?.surface_terrain)}
                          <p className="mt-1 text-xs text-muted-foreground">
                            Total {surfaceLabel(terrain.surface_totale)}
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

export { TerrainsContent }

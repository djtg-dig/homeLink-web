"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  Eye,
  Home,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toaster"
import {
  agencyName,
  createdDateLabel,
  heatingLabel,
  homeTypeLabel,
  maisonAddressLabel,
  maisonDetailPath,
  maisonDisplayName,
  maisonEditPath,
  maisonId,
  maisonReferenceLabel,
  parseMaisons,
  priceLabel,
  standingLabel,
  statusLabel,
  surfaceLabel,
  transactionLabel,
  type Maison,
  type MaisonsResponse,
} from "@/lib/maisons"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

function MaisonsTableSkeleton() {
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
      <td className="px-4 py-4">
        <div className="flex justify-end gap-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-24" />
        </div>
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

function MaisonsContent() {
  const [maisons, setMaisons] = React.useState<Maison[]>([])
  const [count, setCount] = React.useState(0)
  const [deleteError, setDeleteError] = React.useState("")
  const [deletePending, setDeletePending] = React.useState(false)
  const [deletingMaison, setDeletingMaison] = React.useState<Maison | null>(
    null
  )
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const activeCount = React.useMemo(
    () => maisons.filter((maison) => maison.is_active !== false).length,
    [maisons]
  )
  const availableCount = React.useMemo(
    () => maisons.filter((maison) => maison.statut === "disponible").length,
    [maisons]
  )
  const roomsCount = React.useMemo(
    () =>
      maisons.reduce(
        (total, maison) => total + numericValue(maison.maison?.chamber_number),
        0
      ),
    [maisons]
  )

  const loadMaisons = React.useCallback(async (signal?: AbortSignal) => {
    setLoading(true)

    try {
      const response = await apiFetch<MaisonsResponse>(
        "/api/immovables/maisons/",
        { signal }
      )
      const parsed = parseMaisons(response)

      if (signal?.aborted) {
        return
      }

      setMaisons(parsed.maisons)
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
            "Chargement des maisons impossible."
          )
        )
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Chargement des maisons impossible."
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
      void loadMaisons(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadMaisons])

  function reloadMaisons() {
    setLoading(true)
    setError("")
    void loadMaisons()
  }

  function openDeleteDialog(maison: Maison) {
    setDeleteError("")
    setDeletingMaison(maison)
  }

  async function deleteMaison() {
    if (!deletingMaison) {
      return
    }

    const id = maisonId(deletingMaison)

    if (!id) {
      setDeleteError("Cette maison ne contient pas d'identifiant.")
      return
    }

    setDeletePending(true)
    setDeleteError("")

    try {
      await apiFetch<void>(
        `/api/immovables/maisons/${encodeURIComponent(id)}/`,
        {
          method: "DELETE",
        }
      )

      setMaisons((current) =>
        current.filter((maison) => maisonId(maison) !== id)
      )
      setCount((current) => Math.max(0, current - 1))
      setDeletingMaison(null)
      toast({
        description: "La maison a été supprimée.",
        title: "Maison supprimée",
        variant: "success",
      })
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setDeleteError(
          formatApiMessage(caughtError.body, "Suppression impossible.")
        )
      } else {
        setDeleteError(
          caughtError instanceof Error
            ? caughtError.message
            : "Suppression impossible."
        )
      }
    } finally {
      setDeletePending(false)
    }
  }

  return (
    <>
      <DashboardShell title="Maisons" breadcrumbs={[{ label: "Maisons" }]}>
        <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Gestion des maisons
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                Maisons à vendre ou à louer
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Créez et suivez les maisons avec leurs caractéristiques, leur
                adresse et leur rattachement éventuel à une agence.
              </p>
            </div>
            <Button asChild className="h-10 w-full lg:w-auto">
              <Link href="/dashboard/maisons/new">
                <Plus />
                Créer une maison
              </Link>
            </Button>
          </div>
        </section>

        <section
          aria-label="Indicateurs maisons"
          className="grid gap-4 md:grid-cols-4"
        >
          <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
            <p className="text-sm text-muted-foreground">Total maisons</p>
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
              <h2 className="text-lg font-semibold">Liste des maisons</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Consultez les maisons créées sur la plateforme.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={reloadMaisons}
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
            <table className="w-full min-w-[1280px] text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Maison</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Prix</th>
                  <th className="px-4 py-3 font-medium">Adresse</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Détails</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <MaisonsTableSkeleton /> : null}

                {!loading && maisons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12">
                      <div className="mx-auto flex max-w-md flex-col items-center text-center">
                        <span className="flex size-12 items-center justify-center rounded-md bg-secondary text-primary">
                          <Home className="size-6" />
                        </span>
                        <h3 className="mt-4 text-base font-semibold">
                          Aucune maison pour le moment
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Créez une maison pour alimenter cette liste.
                        </p>
                        <Button asChild className="mt-4">
                          <Link href="/dashboard/maisons/new">
                            <Plus />
                            Créer une maison
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : null}

                {!loading
                  ? maisons.map((maison, index) => {
                      const id = maisonId(maison)
                      const key = id || `${maison.title}-${index}`

                      return (
                        <tr
                          key={key}
                          className="border-b border-border last:border-b-0"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                                <Home className="size-5" />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold">
                                  {maisonDisplayName(maison)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {maisonReferenceLabel(maison)} ·{" "}
                                  {createdDateLabel(maison.created_at)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {homeTypeLabel(maison.maison?.home_type)}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {standingLabel(maison.maison?.standing)} ·{" "}
                              {surfaceLabel(maison.surface_habitable)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {agencyName(maison)}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium">
                              {priceLabel(maison)}
                            </span>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {transactionLabel(maison.type_transaction)}
                            </p>
                          </td>
                          <td className="max-w-80 px-4 py-4 text-muted-foreground">
                            <span className="flex items-start gap-1.5">
                              <MapPin className="mt-0.5 size-3.5 shrink-0" />
                              <span className="line-clamp-2">
                                {maisonAddressLabel(maison)}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <StatusPill
                                active={maison.statut === "disponible"}
                              >
                                {statusLabel(maison.statut)}
                              </StatusPill>
                              <StatusPill active={maison.is_active !== false}>
                                <CheckCircle2 className="mr-1 size-3" />
                                {maison.is_active === false
                                  ? "Inactive"
                                  : "Active"}
                              </StatusPill>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium">
                              {maison.maison?.chamber_number ?? "-"} chambres
                            </span>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {heatingLabel(maison.maison?.heating)}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              {id ? (
                                <Button asChild variant="outline" size="sm">
                                  <Link href={maisonDetailPath(id)}>
                                    <Eye />
                                    Voir les détails
                                  </Link>
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" disabled>
                                  <Eye />
                                  Voir les détails
                                </Button>
                              )}
                              {id ? (
                                <Button asChild variant="outline" size="sm">
                                  <Link href={maisonEditPath(id)}>
                                    <Pencil />
                                    Modifier
                                  </Link>
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" disabled>
                                  <Pencil />
                                  Modifier
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={!id}
                                onClick={() => openDeleteDialog(maison)}
                              >
                                <Trash2 />
                                Supprimer
                              </Button>
                            </div>
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

      {deletingMaison ? (
        <DeleteConfirmDialog
          title="Supprimer la maison"
          description={`Vous allez supprimer ${maisonDisplayName(
            deletingMaison
          )}. Cette action est définitive.`}
          error={deleteError}
          pending={deletePending}
          onClose={() => {
            if (!deletePending) {
              setDeletingMaison(null)
            }
          }}
          onConfirm={deleteMaison}
        />
      ) : null}
    </>
  )
}

export { MaisonsContent }

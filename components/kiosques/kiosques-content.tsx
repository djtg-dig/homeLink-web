"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  MapPin,
  Plus,
  RefreshCw,
  Store,
} from "lucide-react"

import { DashboardActionsMenu } from "@/components/dashboard/dashboard-actions-menu"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KiosqueEditDialog } from "@/components/kiosques/kiosque-edit-dialog"
import { Button } from "@/components/ui/button"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toaster"
import {
  createdDateLabel,
  kiosqueAddressLabel,
  kiosqueDetailPath,
  kiosqueDisplayName,
  kiosqueId,
  kiosqueReferenceLabel,
  kiosqueTypeLabel,
  parseKiosques,
  priceLabel,
  statusLabel,
  surfaceLabel,
  transactionLabel,
  type Kiosque,
  type KiosquesResponse,
} from "@/lib/kiosques"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

function KiosquesTableSkeleton() {
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
        <Skeleton className="mt-2 h-3 w-20" />
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
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="ml-auto h-8 w-24" />
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

function KiosquesContent() {
  const [kiosques, setKiosques] = React.useState<Kiosque[]>([])
  const [count, setCount] = React.useState(0)
  const [deleteError, setDeleteError] = React.useState("")
  const [deletePending, setDeletePending] = React.useState(false)
  const [deletingKiosque, setDeletingKiosque] = React.useState<Kiosque | null>(
    null
  )
  const [editingKiosque, setEditingKiosque] = React.useState<Kiosque | null>(
    null
  )
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const activeCount = React.useMemo(
    () => kiosques.filter((kiosque) => kiosque.is_active !== false).length,
    [kiosques]
  )
  const furnishedCount = React.useMemo(
    () =>
      kiosques.filter((kiosque) => kiosque.kiosque?.is_furnished !== false)
        .length,
    [kiosques]
  )
  const totalSurface = React.useMemo(
    () =>
      kiosques.reduce(
        (total, kiosque) => total + numericValue(kiosque.kiosque?.surface),
        0
      ),
    [kiosques]
  )

  const loadKiosques = React.useCallback(async (signal?: AbortSignal) => {
    setLoading(true)

    try {
      const response = await apiFetch<KiosquesResponse>(
        "/api/immovables/kiosques/",
        { signal }
      )
      const parsed = parseKiosques(response)

      if (signal?.aborted) {
        return
      }

      setKiosques(parsed.kiosques)
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
            "Chargement des kiosques impossible."
          )
        )
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Chargement des kiosques impossible."
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
      void loadKiosques(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadKiosques])

  function reloadKiosques() {
    setLoading(true)
    setError("")
    void loadKiosques()
  }

  function updateKiosque(updatedKiosque: Kiosque) {
    const updatedId = kiosqueId(updatedKiosque)

    setKiosques((current) =>
      current.map((kiosque) =>
        kiosqueId(kiosque) === updatedId ? updatedKiosque : kiosque
      )
    )
    setEditingKiosque(null)
  }

  function openDeleteDialog(kiosque: Kiosque) {
    setDeleteError("")
    setDeletingKiosque(kiosque)
  }

  async function deleteKiosque() {
    if (!deletingKiosque) {
      return
    }

    const id = kiosqueId(deletingKiosque)

    if (!id) {
      setDeleteError("Ce kiosque ne contient pas d'identifiant.")
      return
    }

    setDeletePending(true)
    setDeleteError("")

    try {
      await apiFetch<void>(
        `/api/immovables/kiosques/${encodeURIComponent(id)}/`,
        {
          method: "DELETE",
        }
      )

      setKiosques((current) =>
        current.filter((kiosque) => kiosqueId(kiosque) !== id)
      )
      setCount((current) => Math.max(0, current - 1))
      setDeletingKiosque(null)
      toast({
        description: "Le kiosque a été supprimé.",
        title: "Kiosque supprimé",
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
      <DashboardShell title="Kiosques" breadcrumbs={[{ label: "Kiosques" }]}>
        <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Gestion des kiosques
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                Kiosques commerciaux
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Créez et suivez les petites surfaces commerciales à louer ou à
                vendre.
              </p>
            </div>
            <Button asChild className="h-10 w-full lg:w-auto">
              <Link href="/dashboard/kiosques/new">
                <Plus />
                Créer un kiosque
              </Link>
            </Button>
          </div>
        </section>

        <section
          aria-label="Indicateurs kiosques"
          className="grid gap-4 md:grid-cols-4"
        >
          <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
            <p className="text-sm text-muted-foreground">Total kiosques</p>
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
            <p className="text-sm text-muted-foreground">Meublés</p>
            {loading ? (
              <Skeleton className="mt-3 h-9 w-20" />
            ) : (
              <p className="mt-3 text-3xl font-semibold">{furnishedCount}</p>
            )}
          </article>
          <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
            <p className="text-sm text-muted-foreground">Surface totale</p>
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
              <h2 className="text-lg font-semibold">Liste des kiosques</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Consultez les kiosques créés sur la plateforme.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={reloadKiosques}
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
                  <th className="px-4 py-3 font-medium">Kiosque</th>
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
                    Surface
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <KiosquesTableSkeleton /> : null}

                {!loading && kiosques.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12">
                      <div className="mx-auto flex max-w-md flex-col items-center text-center">
                        <span className="flex size-12 items-center justify-center rounded-md bg-secondary text-primary">
                          <Store className="size-6" />
                        </span>
                        <h3 className="mt-4 text-base font-semibold">
                          Aucun kiosque pour le moment
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Créez un kiosque pour alimenter cette liste.
                        </p>
                        <Button asChild className="mt-4">
                          <Link href="/dashboard/kiosques/new">
                            <Plus />
                            Créer un kiosque
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : null}

                {!loading
                  ? kiosques.map((kiosque, index) => {
                      const id = kiosqueId(kiosque)
                      const key = id || `${kiosque.title}-${index}`

                      return (
                        <tr
                          key={key}
                          className="border-b border-border last:border-b-0"
                        >
                          <td className="min-w-0 px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                                <Store className="size-5" />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold">
                                  {kiosqueDisplayName(kiosque)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {kiosqueReferenceLabel(kiosque)} ·{" "}
                                  {createdDateLabel(kiosque.created_at)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground sm:hidden">
                                  {priceLabel(kiosque)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden px-4 py-4 md:table-cell">
                            {kiosqueTypeLabel(kiosque.kiosque?.kiosque_type)}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {kiosque.kiosque?.opening_side_count ?? "-"}{" "}
                              ouvertures
                            </p>
                          </td>
                          <td className="hidden px-4 py-4 sm:table-cell">
                            <span className="font-medium">
                              {priceLabel(kiosque)}
                            </span>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {transactionLabel(kiosque.type_transaction)}
                            </p>
                          </td>
                          <td className="hidden max-w-80 px-4 py-4 text-muted-foreground xl:table-cell">
                            <span className="flex items-start gap-1.5">
                              <MapPin className="mt-0.5 size-3.5 shrink-0" />
                              <span className="line-clamp-2">
                                {kiosqueAddressLabel(kiosque)}
                              </span>
                            </span>
                          </td>
                          <td className="hidden px-4 py-4 lg:table-cell">
                            <div className="flex flex-wrap gap-2">
                              <StatusPill
                                active={kiosque.statut === "disponible"}
                              >
                                {statusLabel(kiosque.statut)}
                              </StatusPill>
                              <StatusPill
                                active={
                                  kiosque.kiosque?.has_electricity === true
                                }
                              >
                                <CheckCircle2 className="mr-1 size-3" />
                                {kiosque.kiosque?.has_electricity
                                  ? "Électricité"
                                  : "Non équipé"}
                              </StatusPill>
                            </div>
                          </td>
                          <td className="hidden px-4 py-4 lg:table-cell">
                            {surfaceLabel(kiosque.kiosque?.surface)}
                            <p className="mt-1 text-xs text-muted-foreground">
                              Total {surfaceLabel(kiosque.surface_totale)}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <DashboardActionsMenu
                              detailHref={
                                id ? kiosqueDetailPath(id) : undefined
                              }
                              onEdit={
                                id
                                  ? () => setEditingKiosque(kiosque)
                                  : undefined
                              }
                              onDelete={
                                id
                                  ? () => openDeleteDialog(kiosque)
                                  : undefined
                              }
                            />
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

      {editingKiosque ? (
        <KiosqueEditDialog
          kiosque={editingKiosque}
          onClose={() => setEditingKiosque(null)}
          onUpdated={updateKiosque}
        />
      ) : null}

      {deletingKiosque ? (
        <DeleteConfirmDialog
          title="Supprimer le kiosque"
          description={`Vous allez supprimer ${kiosqueDisplayName(
            deletingKiosque
          )}. Cette action est définitive.`}
          error={deleteError}
          pending={deletePending}
          onClose={() => {
            if (!deletePending) {
              setDeletingKiosque(null)
            }
          }}
          onConfirm={deleteKiosque}
        />
      ) : null}
    </>
  )
}

export { KiosquesContent }

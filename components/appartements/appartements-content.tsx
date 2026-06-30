"use client"

import * as React from "react"
import Link from "next/link"
import {
  Building2,
  CheckCircle2,
  Home,
  Landmark,
  MapPin,
  Plus,
  RefreshCw,
} from "lucide-react"

import { AppartementEditDialog } from "@/components/appartements/appartement-edit-dialog"
import { DashboardActionsMenu } from "@/components/dashboard/dashboard-actions-menu"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toaster"
import {
  appartementAddressLabel,
  appartementDetailPath,
  appartementDisplayName,
  appartementId,
  appartementMediaGallery,
  appartementReferenceLabel,
  createdDateLabel,
  mediaUrl,
  parseAppartements,
  priceLabel,
  statutLabel,
  surfaceLabel,
  transactionLabel,
  type Appartement,
  type AppartementsResponse,
} from "@/lib/appartements"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

function AppartementsTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="border-b border-border last:border-b-0">
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </td>
          <td className="hidden px-4 py-4 md:table-cell">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="hidden px-4 py-4 sm:table-cell">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="hidden px-4 py-4 xl:table-cell">
            <Skeleton className="h-4 w-56" />
          </td>
          <td className="hidden px-4 py-4 lg:table-cell">
            <Skeleton className="h-6 w-24" />
          </td>
          <td className="px-4 py-4 text-right">
            <Skeleton className="ml-auto h-7 w-28" />
          </td>
        </tr>
      ))}
    </>
  )
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
          ? "bg-secondary text-secondary-foreground"
          : "bg-muted text-muted-foreground"
      )}
    >
      {children}
    </span>
  )
}

function appartementThumbnail(appartement: Appartement) {
  const media = appartementMediaGallery(appartement)[0]

  return media ? mediaUrl(media) : ""
}

function AppartementsContent() {
  const [appartements, setAppartements] = React.useState<Appartement[]>([])
  const [count, setCount] = React.useState(0)
  const [deleteError, setDeleteError] = React.useState("")
  const [deletePending, setDeletePending] = React.useState(false)
  const [deletingAppartement, setDeletingAppartement] =
    React.useState<Appartement | null>(null)
  const [editingAppartement, setEditingAppartement] =
    React.useState<Appartement | null>(null)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const availableCount = React.useMemo(
    () =>
      appartements.filter((appartement) => appartement.statut === "disponible")
        .length,
    [appartements]
  )

  const activeCount = React.useMemo(
    () =>
      appartements.filter((appartement) => appartement.is_active !== false)
        .length,
    [appartements]
  )

  const loadAppartements = React.useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await apiFetch<AppartementsResponse>(
        "/api/immovables/appartements/",
        { signal }
      )
      const parsed = parseAppartements(response)

      if (signal?.aborted) {
        return
      }

      setAppartements(parsed.appartements)
      setCount(parsed.count)
      setError("")
    } catch (caughtError) {
      if (signal?.aborted) {
        return
      }

      if (caughtError instanceof ApiError) {
        setError(formatApiMessage(caughtError.body, "Chargement impossible."))
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Chargement impossible."
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
      void loadAppartements(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadAppartements])

  function reloadAppartements() {
    setLoading(true)
    setError("")
    void loadAppartements()
  }

  function openDeleteDialog(appartement: Appartement) {
    setDeleteError("")
    setDeletingAppartement(appartement)
  }

  function updateAppartement(updatedAppartement: Appartement) {
    const updatedId = appartementId(updatedAppartement)

    setEditingAppartement(null)

    if (!updatedId) {
      void loadAppartements()
      return
    }

    setAppartements((current) =>
      current.map((appartement) =>
        appartementId(appartement) === updatedId
          ? updatedAppartement
          : appartement
      )
    )
  }

  async function deleteAppartement() {
    if (!deletingAppartement) {
      return
    }

    const id = appartementId(deletingAppartement)

    if (!id) {
      setDeleteError("Cet appartement ne contient pas d'identifiant.")
      return
    }

    setDeletePending(true)
    setDeleteError("")

    try {
      await apiFetch<void>(
        `/api/immovables/appartements/${encodeURIComponent(id)}/`,
        {
          method: "DELETE",
        }
      )

      setAppartements((current) =>
        current.filter((appartement) => appartementId(appartement) !== id)
      )
      setCount((current) => Math.max(0, current - 1))
      setDeletingAppartement(null)
      toast({
        description: "L'appartement a été supprimé.",
        title: "Appartement supprimé",
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
      <DashboardShell
        title="Appartements"
        breadcrumbs={[{ label: "Appartements" }]}
      >
        <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Gestion des appartements
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                Appartements immobiliers
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Retrouvez les appartements enregistrés, leurs prix, leurs
                adresses et leurs statuts de publication.
              </p>
            </div>
            <Button asChild className="h-10 w-full lg:w-auto">
              <Link href="/dashboard/appartements/new">
                <Plus />
                Créer un appartement
              </Link>
            </Button>
          </div>
        </section>

        <section
          aria-label="Indicateurs appartements"
          className="grid gap-4 md:grid-cols-3"
        >
          <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
            <p className="text-sm text-muted-foreground">Total appartements</p>
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
        </section>

        <section className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Liste des appartements</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Consultez les biens créés sur la plateforme.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={reloadAppartements}
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
                  <th className="px-4 py-3 font-medium">Appartement</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">
                    Transaction
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
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <AppartementsTableSkeleton /> : null}

                {!loading && appartements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12">
                      <div className="mx-auto flex max-w-md flex-col items-center text-center">
                        <span className="flex size-12 items-center justify-center rounded-md bg-secondary text-primary">
                          <Home className="size-6" />
                        </span>
                        <h3 className="mt-4 text-base font-semibold">
                          Aucun appartement pour le moment
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Créez un appartement pour alimenter cette liste.
                        </p>
                        <Button asChild className="mt-4">
                          <Link href="/dashboard/appartements/new">
                            <Plus />
                            Créer un appartement
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : null}

                {!loading
                  ? appartements.map((appartement, index) => {
                      const id = appartementId(appartement)
                      const key = id || `${appartement.title}-${index}`
                      const thumbnail = appartementThumbnail(appartement)

                      return (
                        <tr
                          key={key}
                          className="border-b border-border last:border-b-0"
                        >
                          <td className="min-w-0 px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span
                                className="flex size-12 shrink-0 items-center justify-center rounded-md bg-secondary bg-cover bg-center text-primary"
                                style={
                                  thumbnail
                                    ? { backgroundImage: `url(${thumbnail})` }
                                    : undefined
                                }
                              >
                                {thumbnail ? null : (
                                  <Landmark className="size-5" />
                                )}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold">
                                  {appartementDisplayName(appartement)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {appartementReferenceLabel(appartement)} ·{" "}
                                  {createdDateLabel(appartement.created_at)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground sm:hidden">
                                  {priceLabel(appartement)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden px-4 py-4 md:table-cell">
                            {transactionLabel(appartement.type_transaction)}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {surfaceLabel(appartement.surface_habitable)}
                            </p>
                          </td>
                          <td className="hidden px-4 py-4 font-medium sm:table-cell">
                            {priceLabel(appartement)}
                          </td>
                          <td className="hidden max-w-80 px-4 py-4 text-muted-foreground xl:table-cell">
                            <span className="flex items-start gap-1.5">
                              <MapPin className="mt-0.5 size-3.5 shrink-0" />
                              <span className="line-clamp-2">
                                {appartementAddressLabel(appartement)}
                              </span>
                            </span>
                          </td>
                          <td className="hidden px-4 py-4 lg:table-cell">
                            <div className="flex flex-wrap gap-2">
                              <StatusPill
                                active={appartement.statut === "disponible"}
                              >
                                {statutLabel(appartement.statut)}
                              </StatusPill>
                              <StatusPill
                                active={appartement.is_active !== false}
                              >
                                <CheckCircle2 className="mr-1 size-3" />
                                {appartement.is_active === false
                                  ? "Inactif"
                                  : "Actif"}
                              </StatusPill>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <DashboardActionsMenu
                              detailHref={
                                id ? appartementDetailPath(id) : undefined
                              }
                              onEdit={
                                id
                                  ? () => setEditingAppartement(appartement)
                                  : undefined
                              }
                              onDelete={
                                id
                                  ? () => openDeleteDialog(appartement)
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

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-primary">
                <Building2 className="size-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold">Immeuble optionnel</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Rattachez un appartement à un immeuble seulement si c’est
                  nécessaire.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/dashboard/immeubles/new">
                <Plus />
                Créer un immeuble
              </Link>
            </Button>
          </article>

          <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-primary">
                <Home className="size-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold">Nouveau dossier</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Publiez un appartement disponible à la vente ou à la location.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/dashboard/appartements/new">
                <Plus />
                Créer
              </Link>
            </Button>
          </article>
        </section>
      </DashboardShell>

      {deletingAppartement ? (
        <DeleteConfirmDialog
          title="Supprimer l'appartement"
          description={`Vous allez supprimer ${appartementDisplayName(
            deletingAppartement
          )}. Cette action est définitive.`}
          error={deleteError}
          pending={deletePending}
          onClose={() => {
            if (!deletePending) {
              setDeletingAppartement(null)
            }
          }}
          onConfirm={deleteAppartement}
        />
      ) : null}

      {editingAppartement ? (
        <AppartementEditDialog
          appartement={editingAppartement}
          onClose={() => setEditingAppartement(null)}
          onUpdated={updateAppartement}
        />
      ) : null}
    </>
  )
}

export { AppartementsContent }

"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  Euro,
  Home,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  RefreshCw,
  Ruler,
  Store,
  Trash2,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KiosqueEditDialog } from "@/components/kiosques/kiosque-edit-dialog"
import { Button } from "@/components/ui/button"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toaster"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import {
  booleanLabel,
  formatDate,
  kiosqueAddressLabel,
  kiosqueDisplayName,
  kiosqueId,
  kiosqueReferenceLabel,
  kiosqueTypeLabel,
  priceLabel,
  statusLabel,
  surfaceLabel,
  textValue,
  transactionLabel,
  type Kiosque,
  type KiosqueDetails,
} from "@/lib/kiosques"
import { cn } from "@/lib/utils"

const equipmentFields: Array<{
  label: string
  name: keyof KiosqueDetails
}> = [
  { label: "Électricité", name: "has_electricity" },
  { label: "Eau", name: "has_water" },
  { label: "Rangement", name: "has_storage" },
  { label: "Grille de sécurité", name: "has_security_grid" },
  { label: "Déplaçable", name: "is_movable" },
  { label: "Meublé", name: "is_furnished" },
]

function textOrDash(value: unknown) {
  return textValue(value) || "-"
}

function ownerName(kiosque: Kiosque) {
  return textOrDash(kiosque.owner?.full_name)
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0">
      <p className="text-xs font-medium text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-1 text-sm leading-6">
        {value === undefined || value === null || value === "" ? "-" : value}
      </div>
    </div>
  )
}

function InfoCard({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode
  icon: LucideIcon
  title: string
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-primary">
          <Icon className="size-4" />
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function StatusPill({
  children,
  muted,
}: {
  children: React.ReactNode
  muted?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        muted
          ? "bg-muted text-muted-foreground"
          : "bg-secondary text-secondary-foreground"
      )}
    >
      {children}
    </span>
  )
}

function KiosqueDetailSkeleton() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <Skeleton className="size-14 shrink-0" />
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-full max-w-2xl" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </section>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  )
}

function KiosqueDetailContent({
  id,
  startInEditMode = false,
}: {
  id: string
  startInEditMode?: boolean
}) {
  const router = useRouter()
  const [kiosque, setKiosque] = React.useState<Kiosque | null>(null)
  const [deleteError, setDeleteError] = React.useState("")
  const [deletePending, setDeletePending] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  // Cette option ouvre directement le formulaire depuis l'action "Modifier".
  const [editDialogOpen, setEditDialogOpen] = React.useState(startInEditMode)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const loadKiosque = React.useCallback(
    async (signal?: AbortSignal) => {
      try {
        const nextKiosque = await apiFetch<Kiosque>(
          `/api/immovables/kiosques/${encodeURIComponent(id)}/`,
          { signal }
        )

        if (signal?.aborted) {
          return
        }

        setKiosque(nextKiosque)
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
    },
    [id]
  )

  React.useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadKiosque(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadKiosque])

  function reloadKiosque() {
    setLoading(true)
    setError("")
    void loadKiosque()
  }

  async function deleteKiosque() {
    const detailId = kiosque ? kiosqueId(kiosque) || id : id

    setDeletePending(true)
    setDeleteError("")

    try {
      await apiFetch<void>(
        `/api/immovables/kiosques/${encodeURIComponent(detailId)}/`,
        {
          method: "DELETE",
        }
      )

      toast({
        description: "Le kiosque a été supprimé.",
        title: "Kiosque supprimé",
        variant: "success",
      })
      router.push("/dashboard/kiosques")
      router.refresh()
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

  function updateKiosque(updatedKiosque: Kiosque) {
    setKiosque(updatedKiosque)
    setEditDialogOpen(false)
  }

  const details = kiosque?.kiosque

  return (
    <DashboardShell
      title={kiosque ? kiosqueDisplayName(kiosque) : "Détails kiosque"}
      breadcrumbs={[
        { href: "/dashboard/kiosques", label: "Kiosques" },
        { label: "Détails" },
      ]}
    >
      {loading ? <KiosqueDetailSkeleton /> : null}

      {!loading && error ? (
        <section className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-destructive">
          <h2 className="text-lg font-semibold">Kiosque introuvable</h2>
          <p className="mt-2 text-sm leading-6">{error}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/kiosques">
                <ArrowLeft />
                Retour aux kiosques
              </Link>
            </Button>
            <Button type="button" onClick={reloadKiosque}>
              <RefreshCw />
              Réessayer
            </Button>
          </div>
        </section>
      ) : null}

      {!loading && kiosque ? (
        <>
          <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                  <Store className="size-7" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold">
                      {kiosqueDisplayName(kiosque)}
                    </h2>
                    <StatusPill muted={kiosque.statut !== "disponible"}>
                      {statusLabel(kiosque.statut)}
                    </StatusPill>
                    <StatusPill muted={kiosque.is_active === false}>
                      {kiosque.is_active === false ? "Inactif" : "Actif"}
                    </StatusPill>
                  </div>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    {kiosqueReferenceLabel(kiosque)}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 whitespace-pre-line text-muted-foreground">
                    {kiosque.description?.trim() ||
                      "Aucune description pour ce kiosque."}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Dernière mise à jour : {formatDate(kiosque.updated_at)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                <Button asChild variant="outline">
                  <Link href="/dashboard/kiosques">
                    <ArrowLeft />
                    Retour
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={reloadKiosque}
                  disabled={loading}
                >
                  <RefreshCw className={cn(loading && "animate-spin")} />
                  Actualiser
                </Button>
                {!editDialogOpen ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <Pencil />
                    Modifier
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setDeleteError("")
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 />
                  Supprimer
                </Button>
              </div>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <InfoCard icon={Home} title="Publication">
                <DetailRow
                  label="Référence"
                  value={kiosqueReferenceLabel(kiosque)}
                />
                <DetailRow
                  label="Transaction"
                  value={transactionLabel(kiosque.type_transaction)}
                />
                <DetailRow label="Statut" value={statusLabel(kiosque.statut)} />
                <DetailRow
                  label="Kiosque actif"
                  value={booleanLabel(kiosque.is_active)}
                />
                <DetailRow
                  label="Propriétaire"
                  value={booleanLabel(kiosque.est_proprietaire)}
                />
                <DetailRow
                  label="Créé le"
                  value={formatDate(kiosque.created_at)}
                />
              </InfoCard>

              <InfoCard icon={MapPin} title="Adresse">
                <DetailRow
                  label="Adresse complète"
                  value={kiosqueAddressLabel(kiosque)}
                />
                <DetailRow
                  label="Rue"
                  value={textOrDash(kiosque.adresse?.street)}
                />
                <DetailRow
                  label="Complément"
                  value={textOrDash(kiosque.adresse?.complement_adresse)}
                />
                <DetailRow
                  label="Quartier"
                  value={textOrDash(
                    kiosque.adresse?.neighborhood ??
                      kiosque.adresse?.sub_locality
                  )}
                />
                <DetailRow
                  label="Ville"
                  value={textOrDash(
                    kiosque.adresse?.city ?? kiosque.adresse?.locality
                  )}
                />
                <DetailRow
                  label="Province"
                  value={textOrDash(
                    kiosque.adresse?.state ??
                      kiosque.adresse?.administrative_area
                  )}
                />
                <DetailRow
                  label="Pays"
                  value={textOrDash(kiosque.adresse?.country)}
                />
                <DetailRow
                  label="Code postal"
                  value={textOrDash(kiosque.adresse?.postal_code)}
                />
                <DetailRow
                  label="Transports à proximité"
                  value={textOrDash(kiosque.adresse?.proximite_transports)}
                />
              </InfoCard>
            </div>

            <div className="space-y-4">
              <InfoCard icon={Euro} title="Prix et surfaces">
                <DetailRow label="Prix affiché" value={priceLabel(kiosque)} />
                <DetailRow
                  label="Prix de vente"
                  value={textOrDash(kiosque.prix_vente)}
                />
                <DetailRow
                  label="Loyer mensuel"
                  value={textOrDash(kiosque.prix_location_mensuel)}
                />
                <DetailRow
                  label="Surface totale"
                  value={surfaceLabel(kiosque.surface_totale)}
                />
                <DetailRow
                  label="Surface du kiosque"
                  value={surfaceLabel(details?.surface)}
                />
              </InfoCard>

              <InfoCard icon={Package} title="Caractéristiques">
                <DetailRow
                  label="Type de kiosque"
                  value={kiosqueTypeLabel(details?.kiosque_type)}
                />
                <DetailRow
                  label="Ouvertures"
                  value={textOrDash(details?.opening_side_count)}
                />
                <DetailRow
                  label="Déplaçable"
                  value={booleanLabel(details?.is_movable)}
                />
                <DetailRow
                  label="Meublé"
                  value={booleanLabel(details?.is_furnished)}
                />
              </InfoCard>
            </div>
          </div>

          <InfoCard icon={Ruler} title="Équipements">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {equipmentFields.map((field) => {
                const active = Boolean(details?.[field.name])

                return (
                  <div
                    key={field.name}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm",
                      active
                        ? "border-secondary bg-secondary text-secondary-foreground"
                        : "border-border bg-muted/40 text-muted-foreground"
                    )}
                  >
                    <span className="font-medium">{field.label}</span>
                    {active ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <XCircle className="size-4" />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 rounded-md border border-border bg-muted/30 px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Description
              </p>
              <p className="mt-1 text-sm leading-6 whitespace-pre-line">
                {textOrDash(details?.description_equipements)}
              </p>
            </div>
          </InfoCard>

          <InfoCard icon={User} title="Propriétaire">
            <DetailRow label="Nom" value={ownerName(kiosque)} />
            <DetailRow
              label="Email"
              value={
                kiosque.owner?.email ? (
                  <a
                    href={`mailto:${kiosque.owner.email}`}
                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    <Mail className="size-3.5" />
                    {kiosque.owner.email}
                  </a>
                ) : (
                  "-"
                )
              }
            />
            <DetailRow
              label="Téléphone"
              value={
                kiosque.owner?.phone_number ? (
                  <a
                    href={`tel:${kiosque.owner.phone_number}`}
                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    <Phone className="size-3.5" />
                    {kiosque.owner.phone_number}
                  </a>
                ) : (
                  "-"
                )
              }
            />
          </InfoCard>

          {deleteDialogOpen ? (
            <DeleteConfirmDialog
              title="Supprimer le kiosque"
              description={`Vous allez supprimer ${kiosqueDisplayName(
                kiosque
              )}. Cette action est définitive.`}
              error={deleteError}
              pending={deletePending}
              onClose={() => {
                if (!deletePending) {
                  setDeleteDialogOpen(false)
                }
              }}
              onConfirm={deleteKiosque}
            />
          ) : null}

          {editDialogOpen ? (
            <KiosqueEditDialog
              kiosque={kiosque}
              onClose={() => setEditDialogOpen(false)}
              onUpdated={updateKiosque}
            />
          ) : null}
        </>
      ) : null}
    </DashboardShell>
  )
}

export { KiosqueDetailContent }

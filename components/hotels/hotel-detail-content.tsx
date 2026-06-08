"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BedDouble,
  CheckCircle2,
  Euro,
  Home,
  Hotel as HotelIcon,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Star,
  Trash2,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { HotelEditDialog } from "@/components/hotels/hotel-edit-dialog"
import { Button } from "@/components/ui/button"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toaster"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import {
  booleanLabel,
  formatDate,
  hotelAddressLabel,
  hotelDisplayName,
  hotelId,
  hotelReferenceLabel,
  hotelTypeLabel,
  priceLabel,
  standingLabel,
  statusLabel,
  surfaceLabel,
  textValue,
  transactionLabel,
  type Hotel,
  type HotelDetails,
} from "@/lib/hotels"
import { cn } from "@/lib/utils"

const equipmentFields: Array<{
  label: string
  name: keyof HotelDetails
}> = [
  { label: "Réception", name: "has_reception" },
  { label: "Restaurant", name: "has_restaurant" },
  { label: "Bar", name: "has_bar" },
  { label: "Salle de conférence", name: "has_conference_room" },
  { label: "Piscine", name: "has_pool" },
  { label: "Parking", name: "has_parking" },
  { label: "Jardin", name: "has_garden" },
  { label: "Générateur", name: "has_generator" },
  { label: "Wi-Fi", name: "has_wifi" },
  { label: "Blanchisserie", name: "has_laundry" },
  { label: "Service de sécurité", name: "has_security_service" },
]

function textOrDash(value: unknown) {
  return textValue(value) || "-"
}

function ownerName(hotel: Hotel) {
  return textOrDash(hotel.owner?.full_name)
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

function HotelDetailSkeleton() {
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

function HotelDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const [hotel, setHotel] = React.useState<Hotel | null>(null)
  const [deleteError, setDeleteError] = React.useState("")
  const [deletePending, setDeletePending] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const loadHotel = React.useCallback(
    async (signal?: AbortSignal) => {
      try {
        const nextHotel = await apiFetch<Hotel>(
          `/api/immovables/hotels/${encodeURIComponent(id)}/`,
          { signal }
        )

        if (signal?.aborted) {
          return
        }

        setHotel(nextHotel)
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
      void loadHotel(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadHotel])

  function reloadHotel() {
    setLoading(true)
    setError("")
    void loadHotel()
  }

  async function deleteHotel() {
    const detailId = hotel ? hotelId(hotel) || id : id

    setDeletePending(true)
    setDeleteError("")

    try {
      await apiFetch<void>(
        `/api/immovables/hotels/${encodeURIComponent(detailId)}/`,
        {
          method: "DELETE",
        }
      )

      toast({
        description: "L'hôtel a été supprimé.",
        title: "Hôtel supprimé",
        variant: "success",
      })
      router.push("/dashboard/hotels")
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

  function updateHotel(updatedHotel: Hotel) {
    setHotel(updatedHotel)
    setEditDialogOpen(false)
  }

  const details = hotel?.hotel

  return (
    <DashboardShell
      title={hotel ? hotelDisplayName(hotel) : "Détails hôtel"}
      breadcrumbs={[
        { href: "/dashboard/hotels", label: "Hôtels" },
        { label: "Détails" },
      ]}
    >
      {loading ? <HotelDetailSkeleton /> : null}

      {!loading && error ? (
        <section className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-destructive">
          <h2 className="text-lg font-semibold">Hôtel introuvable</h2>
          <p className="mt-2 text-sm leading-6">{error}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/hotels">
                <ArrowLeft />
                Retour aux hôtels
              </Link>
            </Button>
            <Button type="button" onClick={reloadHotel}>
              <RefreshCw />
              Réessayer
            </Button>
          </div>
        </section>
      ) : null}

      {!loading && hotel ? (
        <>
          <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                  <HotelIcon className="size-7" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold">
                      {hotelDisplayName(hotel)}
                    </h2>
                    <StatusPill muted={hotel.statut !== "disponible"}>
                      {statusLabel(hotel.statut)}
                    </StatusPill>
                    <StatusPill muted={hotel.is_active === false}>
                      {hotel.is_active === false ? "Inactif" : "Actif"}
                    </StatusPill>
                  </div>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    {hotelReferenceLabel(hotel)}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 whitespace-pre-line text-muted-foreground">
                    {hotel.description?.trim() ||
                      "Aucune description pour cet hôtel."}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Dernière mise à jour : {formatDate(hotel.updated_at)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                <Button asChild variant="outline">
                  <Link href="/dashboard/hotels">
                    <ArrowLeft />
                    Retour
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={reloadHotel}
                  disabled={loading}
                >
                  <RefreshCw className={cn(loading && "animate-spin")} />
                  Actualiser
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Pencil />
                  Modifier
                </Button>
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
                  value={hotelReferenceLabel(hotel)}
                />
                <DetailRow
                  label="Transaction"
                  value={transactionLabel(hotel.type_transaction)}
                />
                <DetailRow label="Statut" value={statusLabel(hotel.statut)} />
                <DetailRow
                  label="Hôtel actif"
                  value={booleanLabel(hotel.is_active)}
                />
                <DetailRow
                  label="Propriétaire"
                  value={booleanLabel(hotel.est_proprietaire)}
                />
                <DetailRow
                  label="Créé le"
                  value={formatDate(hotel.created_at)}
                />
              </InfoCard>

              <InfoCard icon={MapPin} title="Adresse">
                <DetailRow
                  label="Adresse complète"
                  value={hotelAddressLabel(hotel)}
                />
                <DetailRow
                  label="Rue"
                  value={textOrDash(hotel.adresse?.street)}
                />
                <DetailRow
                  label="Complément"
                  value={textOrDash(hotel.adresse?.complement_adresse)}
                />
                <DetailRow
                  label="Quartier"
                  value={textOrDash(
                    hotel.adresse?.neighborhood ?? hotel.adresse?.sub_locality
                  )}
                />
                <DetailRow
                  label="Ville"
                  value={textOrDash(
                    hotel.adresse?.city ?? hotel.adresse?.locality
                  )}
                />
                <DetailRow
                  label="Province"
                  value={textOrDash(
                    hotel.adresse?.state ?? hotel.adresse?.administrative_area
                  )}
                />
                <DetailRow
                  label="Pays"
                  value={textOrDash(hotel.adresse?.country)}
                />
                <DetailRow
                  label="Code postal"
                  value={textOrDash(hotel.adresse?.postal_code)}
                />
                <DetailRow
                  label="Transports à proximité"
                  value={textOrDash(hotel.adresse?.proximite_transports)}
                />
              </InfoCard>
            </div>

            <div className="space-y-4">
              <InfoCard icon={Euro} title="Prix et surfaces">
                <DetailRow label="Prix affiché" value={priceLabel(hotel)} />
                <DetailRow
                  label="Prix de vente"
                  value={textOrDash(hotel.prix_vente)}
                />
                <DetailRow
                  label="Loyer mensuel"
                  value={textOrDash(hotel.prix_location_mensuel)}
                />
                <DetailRow
                  label="Surface totale"
                  value={surfaceLabel(hotel.surface_totale)}
                />
              </InfoCard>

              <InfoCard icon={Star} title="Classification">
                <DetailRow
                  label="Type d'hôtel"
                  value={hotelTypeLabel(details?.hotel_type)}
                />
                <DetailRow
                  label="Standing"
                  value={standingLabel(details?.standing)}
                />
                <DetailRow
                  label="Étoiles"
                  value={textOrDash(details?.star_rating)}
                />
                <DetailRow
                  label="Opérationnel"
                  value={booleanLabel(details?.is_operational)}
                />
                <DetailRow
                  label="Meublé"
                  value={booleanLabel(details?.is_furnished)}
                />
              </InfoCard>

              <InfoCard icon={BedDouble} title="Capacité">
                <DetailRow
                  label="Chambres"
                  value={textOrDash(details?.nombre_chambres)}
                />
                <DetailRow
                  label="Étages"
                  value={textOrDash(details?.nombre_etages)}
                />
                <DetailRow
                  label="Lits"
                  value={textOrDash(details?.nombre_lits_total)}
                />
                <DetailRow
                  label="Salles de bain"
                  value={textOrDash(details?.nombre_salles_bain)}
                />
              </InfoCard>
            </div>
          </div>

          <InfoCard icon={CheckCircle2} title="Équipements">
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
            <DetailRow label="Nom" value={ownerName(hotel)} />
            <DetailRow
              label="Email"
              value={
                hotel.owner?.email ? (
                  <a
                    href={`mailto:${hotel.owner.email}`}
                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    <Mail className="size-3.5" />
                    {hotel.owner.email}
                  </a>
                ) : (
                  "-"
                )
              }
            />
            <DetailRow
              label="Téléphone"
              value={
                hotel.owner?.phone_number ? (
                  <a
                    href={`tel:${hotel.owner.phone_number}`}
                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    <Phone className="size-3.5" />
                    {hotel.owner.phone_number}
                  </a>
                ) : (
                  "-"
                )
              }
            />
          </InfoCard>

          {deleteDialogOpen ? (
            <DeleteConfirmDialog
              title="Supprimer l'hôtel"
              description={`Vous allez supprimer ${hotelDisplayName(
                hotel
              )}. Cette action est définitive.`}
              error={deleteError}
              pending={deletePending}
              onClose={() => {
                if (!deletePending) {
                  setDeleteDialogOpen(false)
                }
              }}
              onConfirm={deleteHotel}
            />
          ) : null}

          {editDialogOpen ? (
            <HotelEditDialog
              hotel={hotel}
              onClose={() => setEditDialogOpen(false)}
              onUpdated={updateHotel}
            />
          ) : null}
        </>
      ) : null}
    </DashboardShell>
  )
}

export { HotelDetailContent }

"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Euro,
  Flame,
  Home,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Ruler,
  ShieldCheck,
  Trash2,
  Trees,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toaster"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import {
  agencyName,
  booleanLabel,
  formatDate,
  heatingLabel,
  homeTypeLabel,
  isolationLabel,
  maisonAddressLabel,
  maisonDisplayName,
  maisonEditPath,
  maisonId,
  maisonReferenceLabel,
  priceLabel,
  standingLabel,
  statusLabel,
  surfaceLabel,
  textValue,
  transactionLabel,
  type Maison,
  type MaisonDetails,
} from "@/lib/maisons"
import { cn } from "@/lib/utils"

const comfortFields: Array<{
  label: string
  name: keyof MaisonDetails
}> = [
  { label: "Maison isolée", name: "is_isolated" },
  { label: "Cuisine équipée", name: "escapade_kitchen" },
  { label: "Jardin", name: "garden" },
  { label: "Terrasse", name: "terrace" },
  { label: "Garage", name: "garage" },
  { label: "Piscine", name: "pool" },
  { label: "Véranda", name: "veranda" },
  { label: "Barbecue", name: "barbecue" },
  { label: "Abri de jardin", name: "garden_shed" },
  { label: "Clôture", name: "fence" },
  { label: "Cheminée", name: "fireplace" },
  { label: "Alarme", name: "alarm" },
  { label: "Caméras", name: "watch_camera" },
  { label: "Digicode", name: "digicode" },
  { label: "Interphone", name: "interphone" },
  { label: "Sécurité avancée", name: "security_forward_system" },
  { label: "Ascenseur", name: "elevator" },
  { label: "Cave", name: "cellar" },
  { label: "Grenier", name: "garner" },
  { label: "Vue mer", name: "view_sea" },
  { label: "Salle de sport", name: "room_sport" },
  { label: "Home cinéma", name: "home_cinema" },
  { label: "Spa", name: "spa" },
  { label: "Domotique", name: "domotique" },
  { label: "Concierge", name: "concierge" },
  { label: "Matériaux premium", name: "premium_material" },
  { label: "Inoccupée", name: "unused" },
  { label: "Rénovation nécessaire", name: "renovation_need" },
]

function textOrDash(value: unknown) {
  return textValue(value) || "-"
}

function ownerName(maison: Maison) {
  return textOrDash(maison.owner?.full_name)
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

function MaisonDetailSkeleton() {
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

function MaisonDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const [maison, setMaison] = React.useState<Maison | null>(null)
  const [deleteError, setDeleteError] = React.useState("")
  const [deletePending, setDeletePending] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const loadMaison = React.useCallback(
    async (signal?: AbortSignal) => {
      try {
        const nextMaison = await apiFetch<Maison>(
          `/api/immovables/maisons/${encodeURIComponent(id)}/`,
          { signal }
        )

        if (signal?.aborted) {
          return
        }

        setMaison(nextMaison)
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
      void loadMaison(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadMaison])

  function reloadMaison() {
    setLoading(true)
    setError("")
    void loadMaison()
  }

  async function deleteMaison() {
    const detailId = maison ? maisonId(maison) || id : id

    setDeletePending(true)
    setDeleteError("")

    try {
      await apiFetch<void>(
        `/api/immovables/maisons/${encodeURIComponent(detailId)}/`,
        {
          method: "DELETE",
        }
      )

      toast({
        description: "La maison a été supprimée.",
        title: "Maison supprimée",
        variant: "success",
      })
      router.push("/dashboard/maisons")
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

  const details = maison?.maison
  const agencySlug = maison?.agency?.slug?.trim()
  const editPath = maison ? maisonEditPath(maisonId(maison) || id) : ""

  return (
    <DashboardShell
      title={maison ? maisonDisplayName(maison) : "Détails maison"}
      breadcrumbs={[
        { href: "/dashboard/maisons", label: "Maisons" },
        { label: "Détails" },
      ]}
    >
      {loading ? <MaisonDetailSkeleton /> : null}

      {!loading && error ? (
        <section className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-destructive">
          <h2 className="text-lg font-semibold">Maison introuvable</h2>
          <p className="mt-2 text-sm leading-6">{error}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/maisons">
                <ArrowLeft />
                Retour aux maisons
              </Link>
            </Button>
            <Button type="button" onClick={reloadMaison}>
              <RefreshCw />
              Réessayer
            </Button>
          </div>
        </section>
      ) : null}

      {!loading && maison ? (
        <>
          <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                  <Home className="size-7" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold">
                      {maisonDisplayName(maison)}
                    </h2>
                    <StatusPill muted={maison.statut !== "disponible"}>
                      {statusLabel(maison.statut)}
                    </StatusPill>
                    <StatusPill muted={maison.is_active === false}>
                      {maison.is_active === false ? "Inactive" : "Active"}
                    </StatusPill>
                  </div>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    {maisonReferenceLabel(maison)}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 whitespace-pre-line text-muted-foreground">
                    {maison.description?.trim() ||
                      "Aucune description pour cette maison."}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Dernière mise à jour : {formatDate(maison.updated_at)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                <Button asChild variant="outline">
                  <Link href="/dashboard/maisons">
                    <ArrowLeft />
                    Retour
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={reloadMaison}
                  disabled={loading}
                >
                  <RefreshCw className={cn(loading && "animate-spin")} />
                  Actualiser
                </Button>
                <Button asChild variant="outline">
                  <Link href={editPath}>
                    <Pencil />
                    Modifier
                  </Link>
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
                  value={maisonReferenceLabel(maison)}
                />
                <DetailRow
                  label="Transaction"
                  value={transactionLabel(maison.type_transaction)}
                />
                <DetailRow label="Statut" value={statusLabel(maison.statut)} />
                <DetailRow
                  label="Maison active"
                  value={booleanLabel(maison.is_active)}
                />
                <DetailRow
                  label="Propriétaire"
                  value={booleanLabel(maison.est_proprietaire)}
                />
                <DetailRow
                  label="Créée le"
                  value={formatDate(maison.created_at)}
                />
              </InfoCard>

              <InfoCard icon={MapPin} title="Adresse">
                <DetailRow
                  label="Adresse complète"
                  value={maisonAddressLabel(maison)}
                />
                <DetailRow
                  label="Rue"
                  value={textOrDash(maison.adresse?.street)}
                />
                <DetailRow
                  label="Complément"
                  value={textOrDash(maison.adresse?.complement_adresse)}
                />
                <DetailRow
                  label="Quartier"
                  value={textOrDash(
                    maison.adresse?.neighborhood ?? maison.adresse?.sub_locality
                  )}
                />
                <DetailRow
                  label="Ville"
                  value={textOrDash(
                    maison.adresse?.city ?? maison.adresse?.locality
                  )}
                />
                <DetailRow
                  label="Province"
                  value={textOrDash(
                    maison.adresse?.state ?? maison.adresse?.administrative_area
                  )}
                />
                <DetailRow
                  label="Pays"
                  value={textOrDash(maison.adresse?.country)}
                />
                <DetailRow
                  label="Transports à proximité"
                  value={textOrDash(maison.adresse?.proximite_transports)}
                />
              </InfoCard>
            </div>

            <div className="space-y-4">
              <InfoCard icon={Euro} title="Prix et surfaces">
                <DetailRow label="Prix affiché" value={priceLabel(maison)} />
                <DetailRow
                  label="Prix de vente"
                  value={textOrDash(maison.prix_vente)}
                />
                <DetailRow
                  label="Loyer mensuel"
                  value={textOrDash(maison.prix_location_mensuel)}
                />
                <DetailRow
                  label="Surface totale"
                  value={surfaceLabel(maison.surface_totale)}
                />
                <DetailRow
                  label="Surface habitable"
                  value={surfaceLabel(maison.surface_habitable)}
                />
              </InfoCard>

              <InfoCard icon={Flame} title="Classification">
                <DetailRow
                  label="Type de maison"
                  value={homeTypeLabel(details?.home_type)}
                />
                <DetailRow
                  label="Standing"
                  value={standingLabel(details?.standing)}
                />
                <DetailRow
                  label="Année de construction"
                  value={textOrDash(details?.building_year)}
                />
                <DetailRow
                  label="Classe énergétique"
                  value={textOrDash(details?.energy_class)}
                />
                <DetailRow
                  label="Chauffage"
                  value={heatingLabel(details?.heating)}
                />
                <DetailRow
                  label="Isolation"
                  value={isolationLabel(details?.isolation)}
                />
              </InfoCard>

              <InfoCard icon={Ruler} title="Composition">
                <DetailRow
                  label="Chambres"
                  value={textOrDash(details?.chamber_number)}
                />
                <DetailRow
                  label="Salles de bain"
                  value={textOrDash(details?.bathroom_number)}
                />
                <DetailRow
                  label="Occupants"
                  value={textOrDash(details?.lodger_number)}
                />
                <DetailRow
                  label="Places garage"
                  value={textOrDash(details?.place_number_garage)}
                />
              </InfoCard>
            </div>
          </div>

          <InfoCard icon={Trees} title="Espaces et options">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {comfortFields.map((field) => {
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
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DetailRow
                label="Surface jardin"
                value={surfaceLabel(details?.garden_area)}
              />
              <DetailRow
                label="Surface terrasse"
                value={surfaceLabel(details?.terrace_area)}
              />
              <DetailRow
                label="Surface piscine"
                value={surfaceLabel(details?.pool_area)}
              />
              <DetailRow
                label="Surface véranda"
                value={surfaceLabel(details?.veranda_area)}
              />
            </div>
          </InfoCard>

          <div className="grid gap-4 xl:grid-cols-2">
            <InfoCard icon={Building2} title="Agence">
              <DetailRow
                label="Nom"
                value={
                  agencySlug ? (
                    <Link
                      href={`/dashboard/agencies/${encodeURIComponent(
                        agencySlug
                      )}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {agencyName(maison)}
                    </Link>
                  ) : (
                    agencyName(maison)
                  )
                }
              />
              <DetailRow
                label="Vérifiée"
                value={booleanLabel(maison.agency?.is_verified)}
              />
              <DetailRow
                label="Statut de vérification"
                value={textOrDash(maison.agency?.verification_status)}
              />
              <DetailRow
                label="Active"
                value={booleanLabel(maison.agency?.is_active)}
              />
            </InfoCard>

            <InfoCard icon={User} title="Propriétaire">
              <DetailRow label="Nom" value={ownerName(maison)} />
              <DetailRow
                label="Email"
                value={
                  maison.owner?.email ? (
                    <a
                      href={`mailto:${maison.owner.email}`}
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                    >
                      <Mail className="size-3.5" />
                      {maison.owner.email}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
              <DetailRow
                label="Téléphone"
                value={
                  maison.owner?.phone_number ? (
                    <a
                      href={`tel:${maison.owner.phone_number}`}
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                    >
                      <Phone className="size-3.5" />
                      {maison.owner.phone_number}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
            </InfoCard>
          </div>

          <InfoCard icon={ShieldCheck} title="Compléments">
            <DetailRow
              label="Architecte renommé"
              value={textOrDash(details?.renowned_architect)}
            />
            <DetailRow label="DPE" value={textOrDash(details?.dpe)} />
          </InfoCard>

          {deleteDialogOpen ? (
            <DeleteConfirmDialog
              title="Supprimer la maison"
              description={`Vous allez supprimer ${maisonDisplayName(
                maison
              )}. Cette action est définitive.`}
              error={deleteError}
              pending={deletePending}
              onClose={() => {
                if (!deletePending) {
                  setDeleteDialogOpen(false)
                }
              }}
              onConfirm={deleteMaison}
            />
          ) : null}
        </>
      ) : null}
    </DashboardShell>
  )
}

export { MaisonDetailContent }

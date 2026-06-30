"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Euro,
  FileImage,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Ruler,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import {
  agencyName,
  booleanLabel,
  bureauAddressLabel,
  bureauDisplayName,
  bureauMediaGallery,
  bureauReferenceLabel,
  conditionLabel,
  formatDate,
  leaseTypeLabel,
  mediaUrl,
  officeTypeLabel,
  ownerName,
  priceLabel,
  statusLabel,
  surfaceLabel,
  textOrDash,
  transactionLabel,
  type Bureau,
  type BureauMedia,
} from "@/lib/bureaux"
import { cn } from "@/lib/utils"

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0">
      <p className="text-xs font-medium uppercase text-muted-foreground">
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

function BureauDetailSkeleton() {
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
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  )
}

function MediaPreview({ media }: { media: BureauMedia }) {
  const url = mediaUrl(media)

  if (!url) {
    return null
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-lg border border-border bg-muted"
    >
      <span
        className="block aspect-video bg-cover bg-center transition group-hover:scale-[1.02]"
        style={{ backgroundImage: `url(${url})` }}
      />
      <span className="block truncate px-3 py-2 text-sm font-medium">
        {media.title?.trim() || "Ouvrir le média"}
      </span>
    </a>
  )
}

function BureauDetailContent({ id }: { id: string }) {
  const [bureau, setBureau] = React.useState<Bureau | null>(null)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const loadBureau = React.useCallback(
    async (signal?: AbortSignal) => {
      try {
        const nextBureau = await apiFetch<Bureau>(
          `/api/immovables/bureaux/${encodeURIComponent(id)}/`,
          { signal }
        )

        if (signal?.aborted) {
          return
        }

        setBureau(nextBureau)
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
      void loadBureau(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadBureau])

  function reloadBureau() {
    setLoading(true)
    setError("")
    void loadBureau()
  }

  const details = bureau?.bureau
  const medias = bureau ? bureauMediaGallery(bureau) : []

  return (
    <DashboardShell
      title={bureau ? bureauDisplayName(bureau) : "Détails bureau"}
      breadcrumbs={[
        { href: "/dashboard/bureaux", label: "Bureaux" },
        { label: "Détails" },
      ]}
    >
      {loading ? <BureauDetailSkeleton /> : null}

      {!loading && error ? (
        <section className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-destructive">
          <h2 className="text-lg font-semibold">Bureau introuvable</h2>
          <p className="mt-2 text-sm leading-6">{error}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/bureaux">
                <ArrowLeft />
                Retour aux bureaux
              </Link>
            </Button>
            <Button type="button" onClick={reloadBureau}>
              <RefreshCw />
              Réessayer
            </Button>
          </div>
        </section>
      ) : null}

      {!loading && bureau ? (
        <>
          <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                  <BriefcaseBusiness className="size-7" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold">
                      {bureauDisplayName(bureau)}
                    </h2>
                    <StatusPill muted={bureau.statut !== "disponible"}>
                      {statusLabel(bureau.statut)}
                    </StatusPill>
                    <StatusPill muted={bureau.is_active === false}>
                      {bureau.is_active === false ? "Inactif" : "Actif"}
                    </StatusPill>
                  </div>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    {bureauReferenceLabel(bureau)}
                  </p>
                  <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-muted-foreground">
                    {bureau.description?.trim() ||
                      "Aucune description pour ce bureau."}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Dernière mise à jour : {formatDate(bureau.updated_at)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                <Button asChild variant="outline">
                  <Link href="/dashboard/bureaux">
                    <ArrowLeft />
                    Retour
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={reloadBureau}
                  disabled={loading}
                >
                  <RefreshCw className={cn(loading && "animate-spin")} />
                  Actualiser
                </Button>
              </div>
            </div>
          </section>

          <InfoCard icon={FileImage} title="Images">
            {medias.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {medias.map((media, index) => (
                  <MediaPreview key={String(media.id ?? index)} media={media} />
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
                Aucune image n&apos;est associée à ce bureau.
              </p>
            )}
          </InfoCard>

          <div className="grid gap-4 xl:grid-cols-2">
            <InfoCard icon={BriefcaseBusiness} title="Publication">
              <DetailRow label="Référence" value={bureauReferenceLabel(bureau)} />
              <DetailRow
                label="Transaction"
                value={transactionLabel(bureau.type_transaction)}
              />
              <DetailRow label="Prix" value={priceLabel(bureau)} />
              <DetailRow label="Statut" value={statusLabel(bureau.statut)} />
              <DetailRow
                label="Bien actif"
                value={booleanLabel(bureau.is_active)}
              />
              <DetailRow
                label="Créé le"
                value={formatDate(bureau.created_at)}
              />
            </InfoCard>

            <InfoCard icon={MapPin} title="Adresse">
              <DetailRow
                label="Adresse complète"
                value={bureauAddressLabel(bureau)}
              />
              <DetailRow label="Rue" value={textOrDash(bureau.adresse?.street)} />
              <DetailRow
                label="Complément"
                value={textOrDash(bureau.adresse?.complement_adresse)}
              />
              <DetailRow
                label="Quartier"
                value={textOrDash(bureau.adresse?.neighborhood)}
              />
              <DetailRow label="Ville" value={textOrDash(bureau.adresse?.city)} />
              <DetailRow
                label="Province"
                value={textOrDash(bureau.adresse?.state)}
              />
              <DetailRow label="Pays" value={textOrDash(bureau.adresse?.country)} />
              <DetailRow
                label="Code postal"
                value={textOrDash(bureau.adresse?.postal_code)}
              />
              <DetailRow
                label="Transports à proximité"
                value={textOrDash(bureau.adresse?.proximite_transports)}
              />
            </InfoCard>

            <InfoCard icon={Building2} title="Bureau">
              <DetailRow
                label="Type de bureau"
                value={officeTypeLabel(details?.office_type)}
              />
              <DetailRow label="État" value={conditionLabel(details?.condition)} />
              <DetailRow
                label="Type de bail"
                value={leaseTypeLabel(details?.lease_type)}
              />
              <DetailRow
                label="Disponible"
                value={details?.is_available === false ? "Non" : "Oui"}
              />
              <DetailRow
                label="Disponible le"
                value={formatDate(details?.available_from)}
              />
              <DetailRow
                label="Capacité recommandée"
                value={textOrDash(details?.recommended_capacity)}
              />
              <DetailRow
                label="Capacité maximale"
                value={textOrDash(details?.max_capacity)}
              />
              <DetailRow
                label="Ports réseau"
                value={textOrDash(details?.network_ports)}
              />
              <DetailRow
                label="Visite virtuelle"
                value={
                  details?.virtual_tour_url ? (
                    <a
                      href={details.virtual_tour_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      Ouvrir la visite
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
            </InfoCard>

            <InfoCard icon={Ruler} title="Surfaces et espaces">
              <DetailRow
                label="Surface habitable"
                value={surfaceLabel(bureau.surface_habitable)}
              />
              <DetailRow
                label="Surface totale"
                value={surfaceLabel(bureau.surface_totale)}
              />
              <DetailRow
                label="Open space"
                value={surfaceLabel(details?.open_space_area)}
              />
              <DetailRow
                label="Bureaux privés"
                value={textOrDash(details?.private_offices_count)}
              />
              <DetailRow
                label="Étage"
                value={textOrDash(details?.floor_number)}
              />
              <DetailRow
                label="Aile"
                value={textOrDash(details?.wing)}
              />
              <DetailRow
                label="Bâtiment"
                value={textOrDash(details?.batiment)}
              />
              <DetailRow
                label="Numéro de porte"
                value={textOrDash(details?.door_number)}
              />
            </InfoCard>

            <InfoCard icon={CheckCircle2} title="Équipements">
              <DetailRow label="Wi-Fi" value={booleanLabel(details?.has_wifi)} />
              <DetailRow
                label="Entrée privée"
                value={booleanLabel(details?.has_private_entrance)}
              />
              <DetailRow
                label="Cuisine privée"
                value={booleanLabel(details?.has_private_kitchen)}
              />
              <DetailRow
                label="Salle de bain privée"
                value={booleanLabel(details?.has_private_bathroom)}
              />
              <DetailRow
                label="Terrasse privée"
                value={booleanLabel(details?.has_private_terrace)}
              />
              <DetailRow
                label="Meubles inclus"
                value={booleanLabel(details?.furniture_included)}
              />
              <DetailRow
                label="Climatisation individuelle"
                value={booleanLabel(details?.has_individual_ac)}
              />
              <DetailRow
                label="Chauffage individuel"
                value={booleanLabel(details?.has_individual_heating)}
              />
            </InfoCard>

            <InfoCard icon={XCircle} title="Sécurité et accès">
              <DetailRow label="Alarme" value={booleanLabel(details?.alarm)} />
              <DetailRow label="Digicode" value={booleanLabel(details?.digicode)} />
              <DetailRow
                label="Interphone"
                value={booleanLabel(details?.interphone)}
              />
              <DetailRow
                label="Caméra"
                value={booleanLabel(details?.watch_camera)}
              />
              <DetailRow
                label="Faux plafond"
                value={booleanLabel(details?.has_false_ceiling)}
              />
              <DetailRow
                label="Plancher technique"
                value={booleanLabel(details?.has_raised_floor)}
              />
            </InfoCard>

            <InfoCard icon={Euro} title="Finances">
              <DetailRow
                label="Loyer mensuel"
                value={textOrDash(details?.monthly_rent)}
              />
              <DetailRow label="Charges" value={textOrDash(details?.charges)} />
              <DetailRow
                label="Dépôt en mois"
                value={textOrDash(details?.deposit_months)}
              />
              <DetailRow
                label="Bail minimum"
                value={textOrDash(details?.minimum_lease_months)}
              />
            </InfoCard>

            <InfoCard icon={User} title="Responsables">
              <DetailRow label="Propriétaire" value={ownerName(bureau)} />
              <DetailRow label="Agence" value={agencyName(bureau)} />
              <DetailRow
                label="Téléphone"
                value={
                  bureau.owner?.phone_number ? (
                    <a
                      href={`tel:${bureau.owner.phone_number}`}
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                    >
                      <Phone className="size-3.5" />
                      {bureau.owner.phone_number}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
              <DetailRow
                label="Email"
                value={
                  bureau.owner?.email ? (
                    <a
                      href={`mailto:${bureau.owner.email}`}
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                    >
                      <Mail className="size-3.5" />
                      {bureau.owner.email}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
            </InfoCard>

            <InfoCard icon={CalendarDays} title="Description des meubles">
              <DetailRow
                label="Description"
                value={textOrDash(details?.furniture_description)}
              />
            </InfoCard>
          </div>
        </>
      ) : null}
    </DashboardShell>
  )
}

export { BureauDetailContent }

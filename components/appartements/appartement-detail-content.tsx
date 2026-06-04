"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BedDouble,
  Building2,
  CheckCircle2,
  Euro,
  FileImage,
  Home,
  Landmark,
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
import {
  agencyName,
  appartementAddressLabel,
  appartementDisplayName,
  appartementReferenceLabel,
  booleanLabel,
  formatDate,
  mediaUrl,
  ownerName,
  priceLabel,
  statutLabel,
  surfaceLabel,
  textOrDash,
  transactionLabel,
  type Appartement,
  type AppartementMedia,
} from "@/lib/appartements"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

const comfortFields: Array<{
  label: string
  name:
    | "meuble"
    | "parking"
    | "cave"
    | "balcon"
    | "terrasse"
    | "jardin"
    | "piscine"
    | "climatisation"
    | "cheminee"
    | "interphone"
}> = [
  { label: "Meublé", name: "meuble" },
  { label: "Parking", name: "parking" },
  { label: "Cave", name: "cave" },
  { label: "Balcon", name: "balcon" },
  { label: "Terrasse", name: "terrasse" },
  { label: "Jardin", name: "jardin" },
  { label: "Piscine", name: "piscine" },
  { label: "Climatisation", name: "climatisation" },
  { label: "Cheminée", name: "cheminee" },
  { label: "Interphone", name: "interphone" },
]

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
      <div className="mt-1 text-sm leading-6">{value || "-"}</div>
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

function AppartementDetailSkeleton() {
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

function MediaPreview({ media }: { media: AppartementMedia }) {
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
        Ouvrir le média
      </span>
    </a>
  )
}

function AppartementDetailContent({ id }: { id: string }) {
  const [appartement, setAppartement] = React.useState<Appartement | null>(null)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const loadAppartement = React.useCallback(
    async (signal?: AbortSignal) => {
      try {
        const nextAppartement = await apiFetch<Appartement>(
          `/api/immovables/appartements/${encodeURIComponent(id)}/`,
          { signal }
        )

        if (signal?.aborted) {
          return
        }

        setAppartement(nextAppartement)
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
      void loadAppartement(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadAppartement])

  function reloadAppartement() {
    setLoading(true)
    setError("")
    void loadAppartement()
  }

  const details = appartement?.appartement
  const agencySlug = appartement?.agency?.slug?.trim()
  const medias = appartement?.medias ?? []
  const visibleMedias = medias.filter((media) => mediaUrl(media))

  return (
    <DashboardShell
      title={appartement ? appartementDisplayName(appartement) : "Détails"}
      breadcrumbs={[
        { href: "/dashboard/appartements", label: "Appartements" },
        { label: "Détails" },
      ]}
    >
      {loading ? <AppartementDetailSkeleton /> : null}

      {!loading && error ? (
        <section className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-destructive">
          <h2 className="text-lg font-semibold">Appartement introuvable</h2>
          <p className="mt-2 text-sm leading-6">{error}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/appartements">
                <ArrowLeft />
                Retour aux appartements
              </Link>
            </Button>
            <Button type="button" onClick={reloadAppartement}>
              <RefreshCw />
              Réessayer
            </Button>
          </div>
        </section>
      ) : null}

      {!loading && appartement ? (
        <>
          <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                  <Landmark className="size-7" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold">
                      {appartementDisplayName(appartement)}
                    </h2>
                    <StatusPill muted={appartement.statut !== "disponible"}>
                      {statutLabel(appartement.statut)}
                    </StatusPill>
                    <StatusPill muted={appartement.is_active === false}>
                      {appartement.is_active === false ? "Inactif" : "Actif"}
                    </StatusPill>
                  </div>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    {appartementReferenceLabel(appartement)}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 whitespace-pre-line text-muted-foreground">
                    {appartement.description?.trim() ||
                      "Aucune description pour cet appartement."}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Dernière mise à jour : {formatDate(appartement.updated_at)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                <Button asChild variant="outline">
                  <Link href="/dashboard/appartements">
                    <ArrowLeft />
                    Retour
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={reloadAppartement}
                  disabled={loading}
                >
                  <RefreshCw className={cn(loading && "animate-spin")} />
                  Actualiser
                </Button>
              </div>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <InfoCard icon={Home} title="Publication">
                <DetailRow
                  label="Transaction"
                  value={transactionLabel(appartement.type_transaction)}
                />
                <DetailRow
                  label="Statut"
                  value={statutLabel(appartement.statut)}
                />
                <DetailRow
                  label="Appartement actif"
                  value={booleanLabel(appartement.is_active)}
                />
                <DetailRow
                  label="Propriétaire"
                  value={booleanLabel(appartement.est_proprietaire)}
                />
                <DetailRow
                  label="Créé le"
                  value={formatDate(appartement.created_at)}
                />
              </InfoCard>

              <InfoCard icon={MapPin} title="Adresse">
                <DetailRow
                  label="Adresse complète"
                  value={appartementAddressLabel(appartement)}
                />
                <DetailRow
                  label="Rue"
                  value={textOrDash(appartement.adresse?.street)}
                />
                <DetailRow
                  label="Complément"
                  value={textOrDash(appartement.adresse?.complement_adresse)}
                />
                <DetailRow
                  label="Quartier"
                  value={textOrDash(appartement.adresse?.neighborhood)}
                />
                <DetailRow
                  label="Ville"
                  value={textOrDash(appartement.adresse?.city)}
                />
                <DetailRow
                  label="Province"
                  value={textOrDash(appartement.adresse?.state)}
                />
                <DetailRow
                  label="Pays"
                  value={textOrDash(appartement.adresse?.country)}
                />
                <DetailRow
                  label="Code postal"
                  value={textOrDash(appartement.adresse?.postal_code)}
                />
                <DetailRow
                  label="Transports à proximité"
                  value={textOrDash(appartement.adresse?.proximite_transports)}
                />
              </InfoCard>
            </div>

            <div className="space-y-4">
              <InfoCard icon={Euro} title="Prix et surfaces">
                <DetailRow
                  label="Prix affiché"
                  value={priceLabel(appartement)}
                />
                <DetailRow
                  label="Prix de vente"
                  value={textOrDash(appartement.prix_vente)}
                />
                <DetailRow
                  label="Loyer mensuel"
                  value={textOrDash(appartement.prix_location_mensuel)}
                />
                <DetailRow
                  label="Surface totale"
                  value={surfaceLabel(appartement.surface_totale)}
                />
                <DetailRow
                  label="Surface habitable"
                  value={surfaceLabel(appartement.surface_habitable)}
                />
                <DetailRow
                  label="Superficie"
                  value={surfaceLabel(details?.superficie)}
                />
                <DetailRow
                  label="Terrasse"
                  value={surfaceLabel(details?.superficie_terrasse)}
                />
              </InfoCard>

              <InfoCard icon={BedDouble} title="Caractéristiques">
                <DetailRow label="Étage" value={textOrDash(details?.etage)} />
                <DetailRow
                  label="Nombre de pièces"
                  value={textOrDash(details?.nombre_pieces)}
                />
                <DetailRow
                  label="Chambres"
                  value={textOrDash(details?.nombre_chambres)}
                />
                <DetailRow
                  label="Salles de bain"
                  value={textOrDash(details?.nombre_sdb)}
                />
                <DetailRow
                  label="Classe énergie"
                  value={textOrDash(details?.classe_energie)}
                />
                <DetailRow
                  label="Émission GES"
                  value={textOrDash(details?.emission_ges)}
                />
                <DetailRow
                  label="Immeuble"
                  value={textOrDash(details?.immeuble)}
                />
              </InfoCard>
            </div>
          </div>

          <InfoCard icon={Ruler} title="Confort">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                      {agencyName(appartement)}
                    </Link>
                  ) : (
                    agencyName(appartement)
                  )
                }
              />
              <DetailRow
                label="Vérifiée"
                value={booleanLabel(appartement.agency?.is_verified)}
              />
              <DetailRow
                label="Statut de vérification"
                value={textOrDash(appartement.agency?.verification_status)}
              />
              <DetailRow
                label="Active"
                value={booleanLabel(appartement.agency?.is_active)}
              />
            </InfoCard>

            <InfoCard icon={User} title="Propriétaire">
              <DetailRow label="Nom" value={ownerName(appartement)} />
              <DetailRow
                label="Email"
                value={
                  appartement.owner?.email ? (
                    <a
                      href={`mailto:${appartement.owner.email}`}
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                    >
                      <Mail className="size-3.5" />
                      {appartement.owner.email}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
              <DetailRow
                label="Téléphone"
                value={
                  appartement.owner?.phone_number ? (
                    <a
                      href={`tel:${appartement.owner.phone_number}`}
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                    >
                      <Phone className="size-3.5" />
                      {appartement.owner.phone_number}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
            </InfoCard>
          </div>

          <InfoCard icon={FileImage} title="Médias">
            {visibleMedias.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visibleMedias.map((media, index) => (
                  <MediaPreview key={String(media.id ?? index)} media={media} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun média n’est associé à cet appartement.
              </p>
            )}
          </InfoCard>
        </>
      ) : null}
    </DashboardShell>
  )
}

export { AppartementDetailContent }

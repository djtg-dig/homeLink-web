"use client"

import Image from "next/image"
import Link from "next/link"
import { Building2, Globe2, Mail, MapPin, Phone, RefreshCw, ShieldCheck } from "lucide-react"
import * as React from "react"

import { SiteFooter } from "@/components/navigation/site-footer"
import { SiteHeader } from "@/components/navigation/site-header"
import { MapView } from "@/components/map-view"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import {
  publicAgencyAddressLabel,
  publicAgencyCover,
  publicAgencyLogo,
  publicAgencyName,
  publicAgencyPropertiesLabel,
  publicAgencyVerifiedLabel,
  publicAgencyWebsiteHref,
  type PublicAgency,
} from "@/lib/public-agencies"

function DetailSkeleton() {
  return (
    <>
      <SiteHeader activeCategory="agences" />
      <main className="min-h-svh bg-background text-foreground">
        <section className="px-4 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-6">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="aspect-[5/2] rounded-lg" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex gap-3 rounded-md border border-border bg-background p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="mt-1 break-words text-sm font-medium">{value}</div>
      </div>
    </div>
  )
}

function PublicAgencyDetailContent({ slug }: { slug: string }) {
  const [agency, setAgency] = React.useState<PublicAgency | null>(null)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const loadAgency = React.useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)

      try {
        const response = await apiFetch<PublicAgency>(
          `/api/agencies/public/${encodeURIComponent(slug)}/`,
          { signal }
        )

        if (signal?.aborted) {
          return
        }

        setAgency(response)
        setError("")
      } catch (caughtError) {
        if (signal?.aborted) {
          return
        }

        const fallback = "Chargement de l'agence impossible."

        if (caughtError instanceof ApiError) {
          setError(formatApiMessage(caughtError.body, fallback))
        } else {
          setError(caughtError instanceof Error ? caughtError.message : fallback)
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [slug]
  )

  React.useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadAgency(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadAgency])

  if (loading) {
    return <DetailSkeleton />
  }

  if (error || !agency) {
    return (
      <>
        <SiteHeader activeCategory="agences" />
        <main className="min-h-svh bg-background text-foreground">
          <section className="px-4 py-8 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-3xl rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-destructive">
              <p className="text-lg font-semibold">Impossible d’afficher cette agence.</p>
              <p className="mt-2 text-sm text-destructive/80">
                {error || "L'agence demandée est introuvable."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button type="button" onClick={() => void loadAgency()}>
                  <RefreshCw />
                  Réessayer
                </Button>
                <Button asChild variant="outline">
                  <Link href="/agences">Retour aux agences</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </>
    )
  }

  const cover = publicAgencyCover(agency)
  const logo = publicAgencyLogo(agency)
  const website = publicAgencyWebsiteHref(agency)
  const email = agency.email?.trim()
  const phone = agency.phone?.trim()

  return (
    <>
      <SiteHeader activeCategory="agences" />
      <main className="min-h-svh bg-background text-foreground">
        <section className="bg-muted/40 px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <Button asChild variant="outline" className="mb-5">
              <Link href="/agences">Retour aux agences</Link>
            </Button>

            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="relative aspect-[5/2] bg-secondary text-primary">
                {cover ? (
                  <Image
                    src={cover}
                    alt={publicAgencyName(agency)}
                    fill
                    unoptimized
                    sizes="100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#e9f8ff,#ffffff)]">
                    <Building2 className="size-14" />
                  </div>
                )}
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="relative -mt-14 flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border-4 border-card bg-secondary text-primary shadow-sm">
                    {logo ? (
                      <Image
                        src={logo}
                        alt={publicAgencyName(agency)}
                        fill
                        unoptimized
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <Building2 className="size-10" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
                        {publicAgencyVerifiedLabel(agency)}
                      </span>
                      <span className="rounded-md bg-brand-orange px-2 py-1 text-xs font-semibold text-brand-navy">
                        {publicAgencyPropertiesLabel(agency)}
                      </span>
                    </div>
                    <h1 className="mt-2 text-3xl leading-tight font-semibold break-words sm:text-4xl">
                      {publicAgencyName(agency)}
                    </h1>
                    <p className="mt-3 flex gap-2 text-sm leading-6 text-muted-foreground">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{publicAgencyAddressLabel(agency)}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Présentation</h2>
              <p className="mt-3 text-sm leading-7 whitespace-pre-line text-muted-foreground">
                {agency.description?.trim() || "Cette agence n'a pas encore ajouté de description publique."}
              </p>
            </article>

            <aside className="space-y-4">
              <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <h2 className="text-xl font-semibold">Contact</h2>
                <div className="mt-4 grid gap-3">
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={
                      email ? (
                        <a href={`mailto:${email}`} className="text-primary hover:underline">
                          {email}
                        </a>
                      ) : (
                        "Non renseigné"
                      )
                    }
                  />
                  <InfoRow
                    icon={Phone}
                    label="Téléphone"
                    value={
                      phone ? (
                        <a href={`tel:${phone}`} className="text-primary hover:underline">
                          {phone}
                        </a>
                      ) : (
                        "Non renseigné"
                      )
                    }
                  />
                  <InfoRow
                    icon={Globe2}
                    label="Site web"
                    value={
                      website ? (
                        <a href={website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {website}
                        </a>
                      ) : (
                        "Non renseigné"
                      )
                    }
                  />
                  <InfoRow
                    icon={ShieldCheck}
                    label="Statut"
                    value={agency.legal_status_label || agency.legal_status || "Non renseigné"}
                  />
                </div>
              </article>
            </aside>
          </div>
        </section>

        <section className="px-4 pb-8 sm:px-8 sm:pb-10 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Localisation</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                La carte de l&apos;agence s&apos;affiche quand les coordonnées sont
                disponibles.
              </p>
              <div className="mt-4">
                <MapView
                  latitude={agency.address?.latitude}
                  longitude={agency.address?.longitude}
                  title={`Carte de ${publicAgencyName(agency)}`}
                />
              </div>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

export { PublicAgencyDetailContent }

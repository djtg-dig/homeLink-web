"use client"

import * as React from "react"
import Link from "next/link"
import { Building2, Eye, Mail, Phone, Plus, RefreshCw } from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  agencyAddressLabel,
  agencyDetailPath,
  agencyDisplayName,
  agencySlug,
  createdDateLabel,
  legalStatusLabel,
  parseAgencies,
  statusLabel,
  type AgenciesResponse,
  type Agency,
} from "@/lib/agencies"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

function ContactCell({ agency }: { agency: Agency }) {
  const email = agency.email?.trim()
  const phone = agency.phone?.trim()

  if (!email && !phone) {
    return <span className="text-muted-foreground">-</span>
  }

  return (
    <div className="space-y-1">
      {email ? (
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-1.5 text-sm font-medium hover:text-primary"
        >
          <Mail className="size-3.5" />
          <span className="truncate">{email}</span>
        </a>
      ) : null}
      {phone ? (
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Phone className="size-3.5" />
          <span className="truncate">{phone}</span>
        </a>
      ) : null}
    </div>
  )
}

function AgenciesTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="border-b border-border last:border-b-0">
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-4 w-44" />
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-4 w-56" />
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-6 w-20" />
          </td>
          <td className="px-4 py-4 text-right">
            <Skeleton className="ml-auto h-7 w-20" />
          </td>
        </tr>
      ))}
    </>
  )
}

function AgenciesListContent() {
  const [agencies, setAgencies] = React.useState<Agency[]>([])
  const [count, setCount] = React.useState(0)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const activeAgencies = React.useMemo(
    () => agencies.filter((agency) => agency.is_active !== false).length,
    [agencies]
  )

  const loadAgencies = React.useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await apiFetch<AgenciesResponse>("/api/agencies/", {
        signal,
      })
      const parsed = parseAgencies(response)

      if (signal?.aborted) {
        return
      }

      setAgencies(parsed.agencies)
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
      void loadAgencies(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadAgencies])

  function reloadAgencies() {
    setLoading(true)
    setError("")
    void loadAgencies()
  }

  return (
    <DashboardShell title="Agences" breadcrumbs={[{ label: "Agences" }]}>
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Gestion des agences
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Agences immobilières
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Retrouvez les agences enregistrées et créez de nouveaux dossiers
              avec leur adresse associée.
            </p>
          </div>
          <Button asChild className="h-10 w-full lg:w-auto">
            <Link href="/dashboard/agencies/new">
              <Plus />
              Créer une agence maintenant
            </Link>
          </Button>
        </div>
      </section>

      <section
        aria-label="Indicateurs agences"
        className="grid gap-4 sm:grid-cols-2"
      >
        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Total agences</p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-3 text-3xl font-semibold">{count}</p>
          )}
        </article>
        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Agences actives</p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-3 text-3xl font-semibold">{activeAgencies}</p>
          )}
        </article>
      </section>

      <section className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Liste des agences</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Suivez les agences ajoutées sur la plateforme.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={reloadAgencies}
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
          <table className="w-full min-w-[920px] text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Agence</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Statut légal</th>
                <th className="px-4 py-3 font-medium">Adresse</th>
                <th className="px-4 py-3 font-medium">État</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <AgenciesTableSkeleton /> : null}

              {!loading && agencies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <div className="mx-auto flex max-w-md flex-col items-center text-center">
                      <span className="flex size-12 items-center justify-center rounded-md bg-secondary text-primary">
                        <Building2 className="size-6" />
                      </span>
                      <h3 className="mt-4 text-base font-semibold">
                        Aucune agence pour le moment
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Créez une première agence pour alimenter cette liste.
                      </p>
                      <Button asChild className="mt-4">
                        <Link href="/dashboard/agencies/new">
                          <Plus />
                          Créer une agence maintenant
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!loading
                ? agencies.map((agency, index) => {
                    const key =
                      agency.id ?? agency.uuid ?? `${agency.name}-${index}`
                    const agencyName = agencyDisplayName(agency)

                    return (
                      <tr
                        key={key}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                              <Building2 className="size-5" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {agencyName}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {createdDateLabel(agency.created_at)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="max-w-64 px-4 py-4">
                          <ContactCell agency={agency} />
                        </td>
                        <td className="px-4 py-4">
                          {legalStatusLabel(agency.legal_status)}
                        </td>
                        <td className="max-w-80 px-4 py-4 text-muted-foreground">
                          <span className="line-clamp-2">
                            {agencyAddressLabel(agency)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "rounded-md px-2 py-1 text-xs font-medium",
                              agency.is_active === false
                                ? "bg-muted text-muted-foreground"
                                : "bg-secondary text-secondary-foreground"
                            )}
                          >
                            {statusLabel(agency.is_active)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {agencySlug(agency) ? (
                            <Button asChild variant="outline" size="sm">
                              <Link href={agencyDetailPath(agencySlug(agency))}>
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

export { AgenciesListContent }

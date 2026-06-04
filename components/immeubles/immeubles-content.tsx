"use client"

import * as React from "react"
import Link from "next/link"
import { Building2, CheckCircle2, Plus, RefreshCw } from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import {
  booleanLabel,
  immeubleDisplayName,
  immeubleId,
  immeubleTypeLabel,
  parseImmeubles,
  type Immeuble,
  type ImmeublesResponse,
} from "@/lib/immeubles"
import { cn } from "@/lib/utils"

function ImmeublesTableSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <tr key={index} className="border-b border-border last:border-b-0">
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0" />
              <Skeleton className="h-4 w-44" />
            </div>
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-4 w-20" />
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-4 w-52" />
          </td>
        </tr>
      ))}
    </>
  )
}

function FeaturePill({
  active,
  label,
}: {
  active?: boolean | null
  label: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
        active
          ? "bg-secondary text-secondary-foreground"
          : "bg-muted text-muted-foreground"
      )}
    >
      {active ? <CheckCircle2 className="size-3" /> : null}
      {label}: {booleanLabel(active)}
    </span>
  )
}

function ImmeublesContent() {
  const [immeubles, setImmeubles] = React.useState<Immeuble[]>([])
  const [count, setCount] = React.useState(0)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const loadImmeubles = React.useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await apiFetch<ImmeublesResponse>(
        "/api/immovables/immeubles/",
        { signal }
      )
      const parsed = parseImmeubles(response)

      if (signal?.aborted) {
        return
      }

      setImmeubles(parsed.immeubles)
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
      void loadImmeubles(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadImmeubles])

  function reloadImmeubles() {
    setLoading(true)
    setError("")
    void loadImmeubles()
  }

  return (
    <DashboardShell title="Immeubles" breadcrumbs={[{ label: "Immeubles" }]}>
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Gestion des immeubles
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Immeubles</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Creez les immeubles qui pourront ensuite etre associes aux
              appartements.
            </p>
          </div>
          <Button asChild className="h-10 w-full lg:w-auto">
            <Link href="/dashboard/immeubles/new">
              <Plus />
              Creer un immeuble
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Total immeubles</p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-3 text-3xl font-semibold">{count}</p>
          )}
        </article>
        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Usage</p>
          <p className="mt-3 text-sm font-medium">
            Selection obligatoire lors de la creation d&apos;un appartement.
          </p>
        </article>
      </section>

      <section className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Liste des immeubles</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selectionnez ou creez les immeubles disponibles pour les
              appartements.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={reloadImmeubles}
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
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Immeuble</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Etages</th>
                <th className="px-4 py-3 font-medium">Equipements</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <ImmeublesTableSkeleton /> : null}

              {!loading && immeubles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12">
                    <div className="mx-auto flex max-w-md flex-col items-center text-center">
                      <span className="flex size-12 items-center justify-center rounded-md bg-secondary text-primary">
                        <Building2 className="size-6" />
                      </span>
                      <h3 className="mt-4 text-base font-semibold">
                        Aucun immeuble pour le moment
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Creez un immeuble pour pouvoir l&apos;associer a un
                        appartement.
                      </p>
                      <Button asChild className="mt-4">
                        <Link href="/dashboard/immeubles/new">
                          <Plus />
                          Creer un immeuble
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!loading
                ? immeubles.map((immeuble, index) => {
                    const key =
                      immeubleId(immeuble) || `${immeuble.nom}-${index}`

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
                            <span className="font-semibold">
                              {immeubleDisplayName(immeuble)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {immeubleTypeLabel(immeuble.type_immeuble)}
                        </td>
                        <td className="px-4 py-4">
                          {immeuble.nombre_etages ?? "-"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <FeaturePill
                              label="Ascenseur"
                              active={immeuble.ascenseur}
                            />
                            <FeaturePill
                              label="Piscine"
                              active={immeuble.piscine}
                            />
                            <FeaturePill
                              label="Jardin"
                              active={immeuble.jardin}
                            />
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
  )
}

export { ImmeublesContent }

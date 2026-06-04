"use client"

import Link from "next/link"
import { Building2, Landmark, Plus, Ruler } from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"

function AppartementsContent() {
  return (
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
              Creez les appartements rattaches a une agence avec leurs
              informations de publication et leurs caracteristiques.
            </p>
          </div>
          <Button asChild className="h-10 w-full lg:w-auto">
            <Link href="/dashboard/appartements/new">
              <Plus />
              Creer un appartement
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-primary">
              <Landmark className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Immeuble requis</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Creez l&apos;immeuble avant de publier ses appartements.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/dashboard/immeubles/new">
              <Plus />
              Creer un immeuble
            </Link>
          </Button>
        </article>

        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-primary">
              <Building2 className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Nouveau dossier</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Publier un appartement disponible a la vente ou a la location.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/dashboard/appartements/new">
              <Plus />
              Creer
            </Link>
          </Button>
        </article>

        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-primary">
              <Ruler className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Caracteristiques</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Surfaces, pieces, confort, energie et rattachement agence.
              </p>
            </div>
          </div>
        </article>
      </section>
    </DashboardShell>
  )
}

export { AppartementsContent }

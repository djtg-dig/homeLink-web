"use client"

import Link from "next/link"
import { Settings } from "lucide-react"

import {
  DashboardShell,
  categoryIcons,
} from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { propertyCategories } from "@/lib/property-categories"

const stats = [
  { label: "Biens publiés", value: "0", change: "À configurer" },
  { label: "Demandes actives", value: "0", change: "À connecter" },
  { label: "Agences", value: "0", change: "À synchroniser" },
  { label: "Visites", value: "0", change: "À suivre" },
]

const categoryLinks: Partial<Record<string, string>> = {
  agences: "/dashboard/agencies",
  appartements: "/dashboard/appartements",
  immeubles: "/dashboard/immeubles",
}

function DashboardContent() {
  return (
    <DashboardShell title="Administration">
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Vue d&apos;ensemble
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Dashboard Homelink</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Espace d&apos;administration pour organiser les catégories, suivre
              les publications et préparer les prochains modules de gestion.
            </p>
          </div>
          <Button asChild className="w-full xl:w-auto">
            <Link href="/dashboard/agencies/new">Créer une agence</Link>
          </Button>
        </div>
      </section>

      <section
        aria-label="Indicateurs"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((item) => (
          <article
            key={item.label}
            className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{item.change}</p>
          </article>
        ))}
      </section>

      <section
        id="categories"
        className="rounded-lg border border-border bg-card text-card-foreground shadow-sm"
      >
        <div className="border-b border-border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Catégories de biens</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Les mêmes entrées que la navigation principale, avec un espace
                dédié pour les futurs modules.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/agencies/new">Nouvelle agence</Link>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {propertyCategories.map((item) => {
                const Icon = categoryIcons[item.slug]
                const categoryLink = categoryLinks[item.slug]
                const categoryIsAvailable = Boolean(categoryLink)

                return (
                  <tr
                    key={item.slug}
                    id={item.slug}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-primary">
                          <Icon className="size-4" />
                        </span>
                        <span className="font-medium">{item.label}</span>
                      </div>
                    </td>
                    <td className="max-w-md px-4 py-4 text-muted-foreground">
                      {item.description}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                        {categoryIsAvailable ? "Disponible" : "En préparation"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {categoryLink ? (
                        <Button asChild variant="outline" size="sm">
                          <Link href={categoryLink}>Ouvrir</Link>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          Ouvrir
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <h2 className="text-lg font-semibold">Activité récente</h2>
          <div className="mt-4 space-y-3">
            {[
              "Connexion utilisateur",
              "Chargement du profil",
              "Dashboard prêt",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between border-b border-border pb-3 text-sm last:border-b-0 last:pb-0"
              >
                <span>{item}</span>
                <span className="text-muted-foreground">Maintenant</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <div className="flex items-center gap-2">
            <Settings className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Configuration</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Les modules métier pourront être branchés ici au fur et à mesure que
            les endpoints deviennent disponibles.
          </p>
        </article>
      </section>
    </DashboardShell>
  )
}

export { DashboardContent }

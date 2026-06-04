import Link from "next/link"
import { ArrowRight, Link2, Search, ShieldCheck } from "lucide-react"

import { HomelinkLogo } from "@/components/homelink-logo"
import { SiteHeader } from "@/components/navigation/site-header"
import { Button } from "@/components/ui/button"

const strengths = [
  {
    id: "biens",
    icon: Search,
    label: "Biens clairs",
    text: "Une recherche lisible pour comparer rapidement les opportunités.",
  },
  {
    id: "connexion",
    icon: Link2,
    label: "Mise en relation",
    text: "Des contacts directs entre propriétaires, agences et clients.",
  },
  {
    id: "fiabilite",
    icon: ShieldCheck,
    label: "Parcours fiable",
    text: "Un socle sobre pour faire évoluer le produit avec confiance.",
  },
]

export default function Page() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <SiteHeader />
      <section className="relative isolate overflow-hidden bg-brand-navy text-brand-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_18%,rgba(121,228,255,0.24),transparent_28%),linear-gradient(135deg,rgba(0,60,255,0.22),transparent_42%)]" />

        <div className="mx-auto flex min-h-[72svh] max-w-6xl flex-col justify-center gap-10 px-4 py-10 pb-14 sm:min-h-[68svh] sm:px-8 sm:py-16 lg:px-10">
          <div className="flex max-w-3xl flex-col gap-7 sm:gap-8">
            <HomelinkLogo
              sizes="(min-width: 1024px) 420px, (min-width: 640px) 360px, 88vw"
              className="h-28 w-full max-w-[22rem] sm:h-32 sm:max-w-[28rem]"
            />
            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl leading-tight font-semibold sm:text-5xl lg:text-6xl">
                Connecter. Simplifier. Vivre mieux.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
                Homelink rapproche les biens, les personnes et les décisions
                dans une expérience immobilière simple et fluide.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-brand-orange text-brand-navy hover:bg-brand-orange/90"
              >
                <Link href="/register">
                  Créer un compte
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/24 bg-white/8 text-white hover:bg-white/14 hover:text-white"
              >
                <Link href="/login">Se connecter</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section
        id="biens"
        className="scroll-mt-20 border-b border-border bg-background px-4 py-10 sm:px-8 sm:py-12 lg:px-10"
      >
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {strengths.map((item) => {
            const Icon = item.icon

            return (
              <article
                id={item.id}
                key={item.label}
                className="scroll-mt-24 rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm"
              >
                <div className="mb-5 flex size-10 items-center justify-center rounded-md bg-secondary text-primary">
                  <Icon className="size-5" />
                </div>
                <h2 className="text-base font-semibold">{item.label}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.text}
                </p>
              </article>
            )
          })}
        </div>
      </section>

      <section
        id="contact"
        className="scroll-mt-20 bg-brand-navy px-4 py-10 text-brand-white sm:px-8 lg:px-10"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold">
              Un bien, une agence, un lien.
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/72">
              Homelink pose un cadre simple pour rapprocher l&apos;offre
              immobilière et les bons contacts.
            </p>
          </div>
          <Button
            asChild
            className="w-full bg-brand-orange text-brand-navy hover:bg-brand-orange/90 sm:w-auto"
          >
            <Link href="/register">
              Démarrer
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}

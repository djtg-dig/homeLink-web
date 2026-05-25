import Link from "next/link"
import { ArrowRight, Link2, Search, ShieldCheck } from "lucide-react"

import { AccountStatus } from "@/components/account/account-status"
import { HomelinkLogo } from "@/components/homelink-logo"
import { Button } from "@/components/ui/button"

const strengths = [
  {
    id: "biens",
    icon: Search,
    label: "Biens clairs",
    text: "Une recherche lisible pour comparer rapidement les opportunites.",
  },
  {
    id: "connexion",
    icon: Link2,
    label: "Mise en relation",
    text: "Des contacts directs entre proprietaires, agences et clients.",
  },
  {
    id: "fiabilite",
    icon: ShieldCheck,
    label: "Parcours fiable",
    text: "Un socle sobre pour faire evoluer le produit avec confiance.",
  },
]

export default function Page() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="relative isolate overflow-hidden bg-brand-navy text-brand-white">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-orange" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_18%,rgba(121,228,255,0.24),transparent_28%),linear-gradient(135deg,rgba(0,60,255,0.22),transparent_42%)]" />
        <header className="sticky top-0 z-20 border-b border-white/10 bg-brand-navy/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-8 lg:px-10">
            <HomelinkLogo
              priority
              sizes="(min-width: 640px) 176px, 144px"
              className="h-11 w-36 shrink-0 sm:h-14 sm:w-44"
            />
            <nav
              aria-label="Navigation principale"
              className="hidden items-center gap-6 text-sm font-medium text-white/76 md:flex"
            >
              <a className="transition hover:text-white" href="#biens">
                Biens
              </a>
              <Link className="transition hover:text-white" href="/login">
                Connexion
              </Link>
              <Link className="transition hover:text-white" href="/register">
                Inscription
              </Link>
            </nav>
            <AccountStatus />
          </div>
        </header>

        <div className="mx-auto flex min-h-[calc(86svh-4rem)] max-w-6xl flex-col justify-center gap-10 px-4 py-10 pb-14 sm:min-h-[68svh] sm:px-8 sm:py-16 lg:px-10">
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
                Homelink rapproche les biens, les personnes et les decisions
                dans une experience immobiliere simple et fluide.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-brand-orange text-brand-navy hover:bg-brand-orange/90"
              >
                <Link href="/register">
                  Creer un compte
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
              immobiliere et les bons contacts.
            </p>
          </div>
          <Button
            asChild
            className="w-full bg-brand-orange text-brand-navy hover:bg-brand-orange/90 sm:w-auto"
          >
            <Link href="/register">
              Demarrer
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}

import Image from "next/image"
import { ArrowRight, Link2, Search, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"

const strengths = [
  {
    icon: Search,
    label: "Biens clairs",
    text: "Une recherche lisible pour comparer rapidement les opportunites.",
  },
  {
    icon: Link2,
    label: "Mise en relation",
    text: "Des contacts directs entre proprietaires, agences et clients.",
  },
  {
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
        <div className="mx-auto flex min-h-[78svh] max-w-6xl flex-col justify-center gap-12 px-6 py-16 sm:px-8 lg:px-10">
          <div className="flex max-w-3xl flex-col gap-8">
            <Image
              src="/logo_non_transperent.png"
              alt="Homelink"
              width={500}
              height={250}
              priority
              className="h-auto w-64 max-w-full sm:w-80"
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
                size="lg"
                className="bg-brand-orange text-brand-navy hover:bg-brand-orange/90"
              >
                Explorer
                <ArrowRight />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/24 bg-white/8 text-white hover:bg-white/14 hover:text-white"
              >
                Nous contacter
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background px-6 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {strengths.map((item) => {
            const Icon = item.icon

            return (
              <article
                key={item.label}
                className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm"
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
    </main>
  )
}

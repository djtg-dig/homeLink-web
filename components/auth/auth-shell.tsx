import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { HomelinkLogo } from "@/components/homelink-logo"
import { SiteFooter } from "@/components/navigation/site-footer"
import { ThemeSwitcher } from "@/components/theme-switcher"

function AuthShell({
  actionHref,
  actionLabel,
  actionText,
  children,
  description,
  title,
}: {
  actionHref: string
  actionLabel: string
  actionText: string
  children: React.ReactNode
  description: string
  title: string
}) {
  return (
    <>
      <main className="min-h-svh bg-muted text-foreground">
        <section className="grid min-h-svh lg:grid-cols-[0.85fr_1.15fr]">
          <div className="bg-brand-navy px-4 py-5 text-brand-white sm:px-8 lg:flex lg:flex-col lg:justify-between lg:px-10 lg:py-8">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" aria-label="Retour à l'accueil">
                <HomelinkLogo
                  priority
                  sizes="(min-width: 640px) 176px, 144px"
                  className="h-11 w-36 sm:h-14 sm:w-44"
                />
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                <ThemeSwitcher className="hidden border-white/20 bg-white/8 text-white sm:inline-flex" />
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-white/20 bg-white/8 text-white hover:bg-white/14 hover:text-white"
                >
                  <Link href="/">
                    <ArrowLeft />
                    Accueil
                  </Link>
                </Button>
              </div>
            </div>

            <div className="hidden max-w-md pb-10 lg:block">
              <p className="text-sm font-medium tracking-[0.18em] text-brand-cyan uppercase">
                Homelink
              </p>
              <h1 className="mt-4 text-4xl leading-tight font-semibold">
                Connecter les bons profils aux bons biens.
              </h1>
              <p className="mt-5 text-sm leading-7 text-white/72">
                Un accès simple et sécurisé pour construire vos parcours
                immobiliers avec confiance.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
            <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
              <div>
                <h2 className="text-2xl font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>

              {children}

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {actionText}{" "}
                <Link
                  href={actionHref}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {actionLabel}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

export { AuthShell }

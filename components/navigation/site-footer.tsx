import Link from "next/link"

import { HomelinkLogo } from "@/components/homelink-logo"
import { propertyCategories } from "@/lib/property-categories"
import { publicCategoryLinks } from "@/lib/public-navigation"

const legalLinks = [
  { href: "/#biens", label: "Explorer les biens" },
  { href: "/login", label: "Connexion" },
  { href: "/register", label: "Inscription" },
]

function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 bg-brand-navy text-brand-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(12rem,0.55fr)] lg:px-10">
        <div className="min-w-0 space-y-4">
          <Link href="/" aria-label="Accueil Loyer360" className="block w-fit">
            <HomelinkLogo
              sizes="(min-width: 640px) 176px, 144px"
              className="h-12 w-40 sm:h-14 sm:w-44"
            />
          </Link>
          <p className="max-w-md text-sm leading-6 text-white/68">
            Loyer360 facilite la découverte des biens immobiliers et la mise en
            relation avec les bons interlocuteurs.
          </p>
        </div>

        <nav aria-label="Biens" className="min-w-0">
          <h2 className="text-sm font-semibold text-white">Biens</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-2">
            {propertyCategories.map((item) => (
              <Link
                key={item.slug}
                href={publicCategoryLinks[item.slug] ?? "/#biens"}
                className="rounded-md py-1.5 text-white/68 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <nav aria-label="Compte" className="min-w-0">
          <h2 className="text-sm font-semibold text-white">Compte</h2>
          <div className="mt-4 grid gap-2 text-sm">
            {legalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md py-1.5 text-white/68 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p>© {currentYear} Loyer360. Tous droits réservés.</p>
          <p>Connecter. Simplifier. Vivre mieux.</p>
        </div>
      </div>
    </footer>
  )
}

export { SiteFooter }

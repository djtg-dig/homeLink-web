"use client"

import Link from "next/link"
import * as React from "react"

import { AccountStatus } from "@/components/account/account-status"
import { HomelinkLogo } from "@/components/homelink-logo"
import { propertyCategories } from "@/lib/property-categories"
import { publicCategoryLinks } from "@/lib/public-navigation"
import { cn } from "@/lib/utils"

function SiteHeader() {
  const [hidden, setHidden] = React.useState(false)

  React.useEffect(() => {
    let previousScrollY = window.scrollY
    let ticking = false

    function updateHeader() {
      const currentScrollY = window.scrollY
      const isScrollingDown = currentScrollY > previousScrollY

      setHidden(isScrollingDown && currentScrollY > 96)
      previousScrollY = Math.max(currentScrollY, 0)
      ticking = false
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader)
        ticking = true
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b border-white/10 bg-brand-navy/95 text-white shadow-sm backdrop-blur transition-transform duration-300 ease-out",
        hidden && "-translate-y-full"
      )}
    >
      <div className="h-1 bg-brand-orange" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:h-20 sm:gap-3 sm:px-8 lg:px-10">
        <Link href="/" aria-label="Accueil Homelink" className="shrink-0">
          <HomelinkLogo
            priority
            sizes="(min-width: 640px) 176px, 144px"
            className="h-8 w-24 sm:h-14 sm:w-44"
          />
        </Link>
        <AccountStatus />
      </div>
      <nav
        aria-label="Catégories de biens"
        className="border-t border-white/10"
      >
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-8 lg:px-10">
          {propertyCategories.map((item) => (
            <Link
              key={item.slug}
              href={publicCategoryLinks[item.slug] ?? "/#biens"}
              className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-white/76 transition hover:bg-white/8 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}

export { SiteHeader }

"use client"

import Link from "next/link"
import { ChevronDown } from "lucide-react"
import * as React from "react"

import { AccountStatus } from "@/components/account/account-status"
import { HomelinkLogo } from "@/components/homelink-logo"
import { propertyCategories } from "@/lib/property-categories"
import { publicCategoryLinks } from "@/lib/public-navigation"
import { cn } from "@/lib/utils"

function SiteHeader() {
  const [hidden, setHidden] = React.useState(false)
  const [categoriesOpen, setCategoriesOpen] = React.useState(false)
  const categoriesMenuRef = React.useRef<HTMLDivElement>(null)

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

  React.useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (
        categoriesMenuRef.current &&
        event.target instanceof Node &&
        !categoriesMenuRef.current.contains(event.target)
      ) {
        setCategoriesOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCategoriesOpen(false)
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
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
      <div className="mx-auto max-w-6xl px-3 py-2 sm:px-8 md:flex md:h-20 md:items-center md:justify-between md:gap-3 md:py-0 lg:px-10">
        <div className="flex min-h-12 items-center justify-between gap-2 md:contents">
          <Link href="/" aria-label="Accueil Homelink" className="shrink-0">
            <HomelinkLogo
              priority
              sizes="(min-width: 768px) 176px, (min-width: 640px) 160px, 112px"
              className="h-10 w-28 sm:h-12 sm:w-40 md:h-14 md:w-44"
            />
          </Link>
          <AccountStatus />
        </div>

        <div className="relative mt-2 md:hidden" ref={categoriesMenuRef}>
          <button
            type="button"
            aria-expanded={categoriesOpen}
            aria-haspopup="menu"
            onClick={() => setCategoriesOpen((open) => !open)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-white/15 bg-white/8 px-3 text-sm font-medium text-white transition outline-none hover:bg-white/14 focus-visible:border-brand-cyan focus-visible:ring-3 focus-visible:ring-brand-cyan/30"
          >
            <span>Catégories de biens</span>
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                categoriesOpen && "rotate-180"
              )}
            />
          </button>

          <div
            role="menu"
            className={cn(
              "absolute top-12 right-0 left-0 z-30 grid max-h-[70svh] gap-1 overflow-y-auto rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg transition",
              categoriesOpen
                ? "visible translate-y-0 opacity-100"
                : "invisible -translate-y-1 opacity-0"
            )}
          >
            {propertyCategories.map((item) => (
              <Link
                key={item.slug}
                role="menuitem"
                href={publicCategoryLinks[item.slug] ?? "/#biens"}
                onClick={() => setCategoriesOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium transition hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <nav
        aria-label="Catégories de biens"
        className="hidden border-t border-white/10 md:block"
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

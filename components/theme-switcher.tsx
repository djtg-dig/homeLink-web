"use client"

import { Laptop, Moon, Sun, type LucideIcon } from "lucide-react"
import { useTheme } from "next-themes"
import * as React from "react"

import { cn } from "@/lib/utils"

type ThemeOption = {
  icon: LucideIcon
  label: string
  value: "light" | "dark" | "system"
}

const themeOptions: ThemeOption[] = [
  { icon: Sun, label: "Light", value: "light" },
  { icon: Moon, label: "Dark", value: "dark" },
  { icon: Laptop, label: "System", value: "system" },
]

const subscribeToClientSnapshot = () => () => undefined // Aucun abonnement externe: sert seulement à différencier serveur et client.
const getClientSnapshot = () => true // Sur le client, le thème stocké peut être lu sans mismatch d'hydratation.
const getServerSnapshot = () => false // Sur le serveur, on affiche System comme rendu stable initial.

function ThemeSwitcher({ className }: { className?: string }) {
  const { setTheme, theme } = useTheme()
  const mounted = React.useSyncExternalStore(
    subscribeToClientSnapshot,
    getClientSnapshot,
    getServerSnapshot
  )

  const selectedTheme = mounted ? theme ?? "system" : "system" // Affiche System par défaut tant que le thème stocké n'est pas lu.

  function onOptionKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) {
    const direction =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0

    if (!direction) {
      return
    }

    event.preventDefault()

    const nextIndex =
      (currentIndex + direction + themeOptions.length) % themeOptions.length
    const nextTheme = themeOptions[nextIndex]

    setTheme(nextTheme.value) // Les flèches clavier changent immédiatement le thème sélectionné.
    document.getElementById(`theme-switcher-${nextTheme.value}`)?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Sélecteur de thème"
      className={cn(
        "inline-flex h-9 shrink-0 items-center rounded-lg border border-border bg-background p-0.5 text-foreground shadow-sm",
        className
      )}
    >
      {themeOptions.map((option, index) => {
        const Icon = option.icon
        const selected = selectedTheme === option.value

        return (
          <button
            key={option.value}
            id={`theme-switcher-${option.value}`}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Thème ${option.label}`}
            title={`Thème ${option.label}`}
            onClick={() => setTheme(option.value)}
            onKeyDown={(event) => onOptionKeyDown(event, index)}
            className={cn(
              "flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition outline-none",
              "focus-visible:ring-3 focus-visible:ring-ring/40",
              selected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export { ThemeSwitcher }

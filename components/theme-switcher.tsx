"use client"

import { Check, Laptop, Moon, Sun, type LucideIcon } from "lucide-react"
import { useTheme } from "next-themes"
import * as React from "react"
import { DropdownMenu } from "radix-ui"

import { cn } from "@/lib/utils"

type ThemeOption = {
  icon: LucideIcon
  label: string
  value: "light" | "dark" | "system"
}

const themeOptions: ThemeOption[] = [
  { icon: Laptop, label: "System", value: "system" },
  { icon: Sun, label: "Light", value: "light" },
  { icon: Moon, label: "Dark", value: "dark" },
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
  const selectedOption =
    themeOptions.find((option) => option.value === selectedTheme) ??
    themeOptions[0]
  const SelectedIcon = selectedOption.icon

  function chooseTheme(nextTheme: ThemeOption["value"]) {
    setTheme(nextTheme) // next-themes enregistre ce choix et applique le thème immédiatement.
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Changer le thème. Thème actuel: ${selectedOption.label}`}
          className={cn(
            "fixed bottom-4 left-4 z-[90] flex size-11 items-center justify-center rounded-lg border border-border bg-background text-foreground shadow-lg transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
            className
          )}
        >
          <SelectedIcon className="size-5" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          side="top"
          sideOffset={8}
          className="z-[95] w-40 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none"
        >
          <DropdownMenu.RadioGroup
            value={selectedTheme}
            onValueChange={(value) =>
              chooseTheme(value as ThemeOption["value"])
            }
          >
            {themeOptions.map((option) => {
              const Icon = option.icon

              return (
                <DropdownMenu.RadioItem
                  key={option.value}
                  value={option.value}
                  className="relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 pr-7 text-sm outline-none transition select-none focus:bg-muted data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span>{option.label}</span>
                  <DropdownMenu.ItemIndicator className="absolute right-2">
                    <Check className="size-4" aria-hidden="true" />
                  </DropdownMenu.ItemIndicator>
                </DropdownMenu.RadioItem>
              )
            })}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export { ThemeSwitcher }

"use client"

import { useRouter } from "next/navigation"
import {
  ImageIcon,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"
import * as React from "react"

import { HouseAiSearch } from "@/components/home/house-ai-search"
import {
  PublicPropertyCard,
  PublicResultsSkeleton,
} from "@/components/home/public-property-card"
import { SiteFooter } from "@/components/navigation/site-footer"
import { SiteHeader } from "@/components/navigation/site-header"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import {
  buildPublicImmovablesQuery,
  initialPublicImmovableFilters,
  parsePublicImmovables,
  publicSortOptions,
  publicStatusOptions,
  publicTransactionOptions,
  publicTypeOptions,
  type PublicImmovable,
  type PublicImmovableFilters,
  type PublicImmovablesResponse,
} from "@/lib/public-immovables"
import { cn } from "@/lib/utils"

type HomeContentProps = {
  initialFilters?: Partial<PublicImmovableFilters>
}

type SelectOption = {
  label: string
  value: string
}

const heroStats = [
  { label: "Catégories", value: "7" },
  { label: "Recherche", value: "Avancée" },
  { label: "Accès", value: "Public" },
]

const defaultHeroCopy = {
  description:
    "Appartements, maisons, bureaux, hôtels, kiosques, terrains et salles événement sont regroupés dans une recherche simple à affiner selon vos critères.",
}

const heroCopyByType: Partial<
  Record<PublicImmovableFilters["type_bien"], typeof defaultHeroCopy>
> = {
  maison: {
    description:
      "Explorez les maisons disponibles à la vente ou à la location, puis affinez par commune, budget, chambres, salles de bain et équipements.",
  },
}

function heroCopy(type: PublicImmovableFilters["type_bien"]) {
  return heroCopyByType[type] ?? defaultHeroCopy
}

function mergeFilters(filters?: Partial<PublicImmovableFilters>) {
  const mergedFilters = {
    ...initialPublicImmovableFilters,
    ...filters,
  }

  return {
    ...mergedFilters,
    sort_by: mergedFilters.sort_by || initialPublicImmovableFilters.sort_by,
    sort_order:
      mergedFilters.sort_order || initialPublicImmovableFilters.sort_order,
  }
}

function safeErrorMessage(message: string, fallback: string) {
  const normalizedMessage = message.trim()

  return normalizedMessage.startsWith("<") ? fallback : normalizedMessage
}

function buildHomeUrl(filters: PublicImmovableFilters) {
  const query = buildPublicImmovablesQuery(filters)

  return query ? `/?${query}#biens` : "/#biens"
}

function TextField({
  inputMode,
  label,
  name,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  label: string
  name: keyof PublicImmovableFilters
  onChange: (name: keyof PublicImmovableFilters, value: string) => void
  placeholder?: string
  type?: React.HTMLInputTypeAttribute
  value: string
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      {label}
      <input
        inputMode={inputMode}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm transition outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30"
      />
    </label>
  )
}

function SelectField({
  label,
  name,
  onChange,
  options,
  placeholder,
  value,
}: {
  label: string
  name: keyof PublicImmovableFilters
  onChange: (name: keyof PublicImmovableFilters, value: string) => void
  options: SelectOption[]
  placeholder: string
  value: string
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      {label}
      <Select
        value={value || "all"}
        onValueChange={(nextValue) =>
          onChange(name, nextValue === "all" ? "" : nextValue)
        }
      >
        <SelectTrigger className="h-10 w-full bg-background">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}

function SortField({
  onChange,
  value,
}: {
  onChange: (name: keyof PublicImmovableFilters, value: string) => void
  value: PublicImmovableFilters
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium text-foreground">
        Trier par
        <Select
          value={value.sort_by}
          onValueChange={(nextValue) => onChange("sort_by", nextValue)}
        >
          <SelectTrigger className="h-10 w-full bg-background">
            <SelectValue placeholder="Plus récents" />
          </SelectTrigger>
          <SelectContent position="popper">
            {publicSortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-foreground">
        Ordre
        <Select
          value={value.sort_order}
          onValueChange={(nextValue) => onChange("sort_order", nextValue)}
        >
          <SelectTrigger className="h-10 w-full bg-background">
            <SelectValue placeholder="Décroissant" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="desc">Décroissant</SelectItem>
            <SelectItem value="asc">Croissant</SelectItem>
          </SelectContent>
        </Select>
      </label>
    </div>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-secondary text-primary">
        <ImageIcon className="size-6" />
      </div>
      <h2 className="text-xl font-semibold">Aucun bien trouvé</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Essayez d’élargir votre recherche ou de retirer quelques filtres.
      </p>
      <Button type="button" className="mt-5" onClick={onReset}>
        Réinitialiser
      </Button>
    </div>
  )
}

function HomeContent({ initialFilters }: HomeContentProps) {
  const router = useRouter()
  const normalizedInitialFilters = React.useMemo(
    () => mergeFilters(initialFilters),
    [initialFilters]
  )
  const [advancedOpen, setAdvancedOpen] = React.useState(false)
  const [appliedFilters, setAppliedFilters] = React.useState(
    normalizedInitialFilters
  )
  const [draftFilters, setDraftFilters] = React.useState(
    normalizedInitialFilters
  )
  const [count, setCount] = React.useState(0)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [properties, setProperties] = React.useState<PublicImmovable[]>([])

  const activeFiltersCount = React.useMemo(
    () =>
      Object.entries(appliedFilters).filter(([key, value]) => {
        if (key === "sort_by" || key === "sort_order") {
          return false
        }

        return Boolean(value.trim())
      }).length,
    [appliedFilters]
  )

  const hasResults = properties.length > 0

  const loadProperties = React.useCallback(
    async (filters: PublicImmovableFilters, signal?: AbortSignal) => {
      setLoading(true)

      try {
        const query = buildPublicImmovablesQuery(filters)
        const response = await apiFetch<PublicImmovablesResponse>(
          query
            ? `/api/immovables/public/?${query}`
            : "/api/immovables/public/",
          { signal }
        )
        const parsed = parsePublicImmovables(response)

        if (signal?.aborted) {
          return
        }

        setProperties(parsed.properties)
        setCount(parsed.count)
        setError("")
      } catch (caughtError) {
        if (signal?.aborted) {
          return
        }

        const fallback = "Chargement des biens impossible."

        if (caughtError instanceof ApiError) {
          setError(
            safeErrorMessage(
              formatApiMessage(caughtError.body, fallback),
              fallback
            )
          )
        } else {
          setError(
            safeErrorMessage(
              caughtError instanceof Error ? caughtError.message : fallback,
              fallback
            )
          )
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    []
  )

  React.useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadProperties(appliedFilters, controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [appliedFilters, loadProperties])

  function updateFilter(name: keyof PublicImmovableFilters, value: string) {
    setDraftFilters((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function applyFilters(filters: PublicImmovableFilters) {
    setAppliedFilters(filters)
    router.replace(buildHomeUrl(filters), { scroll: false })
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    applyFilters(draftFilters)
  }

  function applyType(type: string) {
    const nextFilters = {
      ...draftFilters,
      type_bien: draftFilters.type_bien === type ? "" : type,
    }

    setDraftFilters(nextFilters)
    applyFilters(nextFilters)
  }

  function resetFilters() {
    const nextFilters = initialPublicImmovableFilters

    setDraftFilters(nextFilters)
    applyFilters(nextFilters)
  }

  function reload() {
    setError("")
    void loadProperties(appliedFilters)
  }

  const currentHeroCopy = heroCopy(draftFilters.type_bien)

  return (
    <>
      <SiteHeader />
      <main className="min-h-svh overflow-x-hidden bg-background text-foreground">
        <section className="bg-brand-navy text-brand-white">
          <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-9 px-4 py-10 sm:px-8 sm:py-14 lg:px-10">
            <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
              <div className="max-w-3xl min-w-0 space-y-6">
                <div className="space-y-4">
                  <h1 className="max-w-3xl text-3xl leading-tight font-semibold text-white sm:text-4xl lg:text-5xl">
                    Trouvez un bien immobilier avec Loyer360
                  </h1>
                  <p className="max-w-full text-base leading-7 text-white/78 sm:max-w-2xl sm:text-lg">
                    {currentHeroCopy.description}
                  </p>
                </div>
              </div>

              <div className="grid w-full max-w-[22rem] min-w-0 grid-cols-1 gap-2 rounded-lg border border-white/12 bg-white/8 p-2 backdrop-blur md:max-w-none md:grid-cols-3">
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-md bg-white/9 px-3 py-4 text-center"
                  >
                    <p className="text-lg font-semibold text-brand-orange">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs font-medium text-white/70">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {publicTypeOptions.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => applyType(type.value)}
                  className={cn(
                    "shrink-0 rounded-md border px-3 py-2 text-sm font-medium transition",
                    draftFilters.type_bien === type.value
                      ? "border-brand-orange bg-brand-orange text-brand-navy"
                      : "border-white/16 bg-white/7 text-white/78 hover:bg-white/12 hover:text-white"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section
          id="biens"
          className="scroll-mt-28 bg-muted/40 px-4 py-8 sm:px-8 sm:py-10 lg:px-10"
        >
          <div className="mx-auto max-w-6xl space-y-6">
            <form
              onSubmit={onSubmit}
              className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5"
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(12rem,0.7fr)_minmax(12rem,0.7fr)_auto] lg:items-end">
                <TextField
                  label="Recherche"
                  name="search"
                  value={draftFilters.search}
                  placeholder="Titre, description, quartier..."
                  onChange={updateFilter}
                />
                <SelectField
                  label="Type de bien"
                  name="type_bien"
                  value={draftFilters.type_bien}
                  placeholder="Tous les biens"
                  options={publicTypeOptions}
                  onChange={updateFilter}
                />
                <SelectField
                  label="Transaction"
                  name="type_transaction"
                  value={draftFilters.type_transaction}
                  placeholder="Toutes"
                  options={publicTransactionOptions}
                  onChange={updateFilter}
                />
                <div className="flex gap-2">
                  <Button type="submit" className="h-10 flex-1 lg:flex-none">
                    <Search />
                    Rechercher
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-3"
                    aria-expanded={advancedOpen}
                    onClick={() => setAdvancedOpen((open) => !open)}
                  >
                    <SlidersHorizontal />
                    <span className="sr-only">Filtres avancés</span>
                  </Button>
                </div>
              </div>

              <div
                className={cn(
                  "grid transition-all",
                  advancedOpen
                    ? "mt-5 grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="grid gap-4 border-t border-border pt-5 md:grid-cols-2 xl:grid-cols-4">
                    <SelectField
                      label="Statut"
                      name="statut"
                      value={draftFilters.statut}
                      placeholder="Tous les statuts"
                      options={publicStatusOptions}
                      onChange={updateFilter}
                    />
                    <TextField
                      label="Ville"
                      name="city"
                      value={draftFilters.city}
                      placeholder="Kinshasa"
                      onChange={updateFilter}
                    />
                    <TextField
                      label="Quartier"
                      name="neighborhood"
                      value={draftFilters.neighborhood}
                      placeholder="Gombe, UPN..."
                      onChange={updateFilter}
                    />
                    <label className="grid gap-2 text-sm font-medium text-foreground">
                      Images
                      <Select
                        value={draftFilters.has_medias || "all"}
                        onValueChange={(nextValue) =>
                          updateFilter(
                            "has_medias",
                            nextValue === "all" ? "" : nextValue
                          )
                        }
                      >
                        <SelectTrigger className="h-10 w-full bg-background">
                          <SelectValue placeholder="Tous" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="all">Tous</SelectItem>
                          <SelectItem value="true">Avec image</SelectItem>
                          <SelectItem value="false">Sans image</SelectItem>
                        </SelectContent>
                      </Select>
                    </label>
                    <TextField
                      inputMode="decimal"
                      label="Prix min."
                      name="min_price"
                      value={draftFilters.min_price}
                      placeholder="50000"
                      onChange={updateFilter}
                    />
                    <TextField
                      inputMode="decimal"
                      label="Prix max."
                      name="max_price"
                      value={draftFilters.max_price}
                      placeholder="500000"
                      onChange={updateFilter}
                    />
                    <TextField
                      inputMode="decimal"
                      label="Surface min."
                      name="min_surface"
                      value={draftFilters.min_surface}
                      placeholder="50"
                      onChange={updateFilter}
                    />
                    <TextField
                      inputMode="decimal"
                      label="Surface max."
                      name="max_surface"
                      value={draftFilters.max_surface}
                      placeholder="500"
                      onChange={updateFilter}
                    />
                  </div>
                  <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <SortField value={draftFilters} onChange={updateFilter} />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10"
                      onClick={resetFilters}
                    >
                      <X />
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              </div>
            </form>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Biens disponibles</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {loading
                    ? "Chargement en cours..."
                    : `${count} bien${count > 1 ? "s" : ""} trouvé${
                        count > 1 ? "s" : ""
                      }`}
                  {activeFiltersCount > 0
                    ? ` avec ${activeFiltersCount} filtre${
                        activeFiltersCount > 1 ? "s" : ""
                      } actif${activeFiltersCount > 1 ? "s" : ""}`
                    : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={reload}
                disabled={loading}
              >
                <RefreshCw className={cn(loading && "animate-spin")} />
                Actualiser
              </Button>
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
                <p className="font-medium">
                  Oups, impossible d’afficher les biens.
                </p>
                <p className="mt-1 text-destructive/80">{error}</p>
              </div>
            ) : loading ? (
              <PublicResultsSkeleton />
            ) : hasResults ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => (
                  <PublicPropertyCard
                    key={
                      property.id ?? property.reference ?? property.detail_url
                    }
                    property={property}
                  />
                ))}
              </div>
            ) : (
              <EmptyState onReset={resetFilters} />
            )}
          </div>
        </section>
      </main>
      <HouseAiSearch />
      <SiteFooter />
    </>
  )
}

export { HomeContent }

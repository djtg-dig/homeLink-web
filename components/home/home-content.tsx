"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Building2,
  Home,
  Hotel,
  ImageIcon,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Store,
  X,
} from "lucide-react"
import * as React from "react"

import { HomelinkLogo } from "@/components/homelink-logo"
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
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, apiFetch, jsonHeaders } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import {
  buildPublicImmovablesQuery,
  initialPublicImmovableFilters,
  parsePublicImmovables,
  publicImmovableAddressLabel,
  publicImmovableDetailPath,
  publicImmovableHighlights,
  publicImmovableImage,
  publicImmovablePriceLabel,
  publicImmovableReferenceLabel,
  publicImmovableStatusLabel,
  publicImmovableTitle,
  publicImmovableTransactionLabel,
  publicImmovableType,
  publicImmovableTypeLabel,
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

type HouseAiFilterValue = boolean | number | string | null

type HouseAiFilters = {
  bathroom_number?: HouseAiFilterValue
  chamber_number?: HouseAiFilterValue
  commune?: HouseAiFilterValue
  devise?: HouseAiFilterValue
  garage?: HouseAiFilterValue
  garden?: HouseAiFilterValue
  max_chamber_number?: HouseAiFilterValue
  max_price?: HouseAiFilterValue
  min_chamber_number?: HouseAiFilterValue
  min_price?: HouseAiFilterValue
  pool?: HouseAiFilterValue
  quartier?: HouseAiFilterValue
  terrace?: HouseAiFilterValue
  type_bien?: HouseAiFilterValue
  type_transaction?: HouseAiFilterValue
  [key: string]: HouseAiFilterValue | undefined
}

type HouseAiSearchResponse = {
  filters?: HouseAiFilters | null
  success?: boolean
}

const heroStats = [
  { label: "Catégories", value: "7" },
  { label: "Recherche", value: "Avancée" },
  { label: "Accès", value: "Public" },
]

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

function buildHouseAiQuery(filters: HouseAiFilters) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return
    }

    params.set(key, String(value))
  })

  return params.toString()
}

const houseAiBooleanLabels: Record<string, [string, string]> = {
  garage: ["Avec garage", "Sans garage"],
  garden: ["Avec jardin", "Sans jardin"],
  pool: ["Avec piscine", "Sans piscine"],
  terrace: ["Avec terrasse", "Sans terrasse"],
}

function houseAiFilterLabel(
  key: string,
  value: HouseAiFilterValue | undefined
) {
  if (value === null || value === undefined || value === "") {
    return ""
  }

  if (key === "type_bien") {
    return ""
  }

  if (key === "commune") {
    return `Commune : ${value}`
  }

  if (key === "quartier") {
    return `Quartier : ${value}`
  }

  if (key === "type_transaction") {
    return (
      publicTransactionOptions.find((option) => option.value === value)
        ?.label ?? String(value)
    )
  }

  if (key === "chamber_number") {
    return `${value} chambre${String(value) === "1" ? "" : "s"}`
  }

  if (key === "min_chamber_number") {
    return `${value} chambres minimum`
  }

  if (key === "max_chamber_number") {
    return `${value} chambres maximum`
  }

  if (key === "bathroom_number") {
    return `${value} salle${String(value) === "1" ? "" : "s"} de bain`
  }

  if (key === "min_price") {
    return `Prix minimum : ${value}`
  }

  if (key === "max_price") {
    return `Prix maximum : ${value}`
  }

  if (key === "devise") {
    return `Devise : ${value}`
  }

  if (key in houseAiBooleanLabels && typeof value === "boolean") {
    return houseAiBooleanLabels[key][value ? 0 : 1]
  }

  return ""
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

function PropertyIcon({ type }: { type?: string | null }) {
  const className = "size-8"

  if (type === "hotel") {
    return <Hotel className={className} />
  }

  if (type === "kiosque") {
    return <Store className={className} />
  }

  if (type === "maison" || type === "appartement") {
    return <Home className={className} />
  }

  return <Building2 className={className} />
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <article
          key={index}
          className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-7 w-16" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function PropertyCard({ property }: { property: PublicImmovable }) {
  const detailPath = publicImmovableDetailPath(property)
  const image = publicImmovableImage(property)
  const highlights = publicImmovableHighlights(property)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary text-primary">
        {image ? (
          <Image
            src={image}
            alt={publicImmovableTitle(property)}
            fill
            unoptimized
            sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#e9f8ff,#ffffff)]">
            <PropertyIcon type={publicImmovableType(property)} />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className="rounded-md bg-brand-navy/90 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
            {publicImmovableTypeLabel(property)}
          </span>
          <span className="rounded-md bg-brand-orange px-2 py-1 text-xs font-semibold text-brand-navy">
            {publicImmovableTransactionLabel(property)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
            <span>{publicImmovableReferenceLabel(property)}</span>
            <span className="rounded-md bg-muted px-2 py-1 text-foreground">
              {publicImmovableStatusLabel(property)}
            </span>
          </div>
          <h2 className="line-clamp-2 text-lg leading-snug font-semibold">
            {publicImmovableTitle(property)}
          </h2>
          <p className="flex gap-2 text-sm leading-6 text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="line-clamp-2">
              {publicImmovableAddressLabel(property)}
            </span>
          </p>
        </div>

        {highlights.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {highlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground"
              >
                {highlight}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-lg font-semibold text-primary">
            {publicImmovablePriceLabel(property)}
          </p>
          {detailPath ? (
            <Button asChild size="sm" className="shrink-0">
              <Link href={detailPath}>
                Voir
                <ArrowRight />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
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
  const [aiDialogOpen, setAiDialogOpen] = React.useState(false)
  const [aiQuery, setAiQuery] = React.useState("")
  const [aiSubmittedQuery, setAiSubmittedQuery] = React.useState("")
  const [aiFilters, setAiFilters] = React.useState<HouseAiFilters | null>(null)
  const [aiProperties, setAiProperties] = React.useState<PublicImmovable[]>([])
  const [aiCount, setAiCount] = React.useState(0)
  const [aiError, setAiError] = React.useState("")
  const [aiLoading, setAiLoading] = React.useState(false)
  const aiInputRef = React.useRef<HTMLTextAreaElement>(null)
  const aiResultsRef = React.useRef<HTMLElement>(null)

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
  const aiFilterLabels = React.useMemo(
    () =>
      Object.entries(aiFilters ?? {})
        .map(([key, value]) => houseAiFilterLabel(key, value))
        .filter(Boolean),
    [aiFilters]
  )

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

  React.useEffect(() => {
    if (!aiDialogOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    const focusTimer = window.setTimeout(() => aiInputRef.current?.focus(), 50)

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAiDialogOpen(false)
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", closeOnEscape)

    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [aiDialogOpen])

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

  async function submitAiSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const queryText = aiQuery.trim()

    if (!queryText || aiLoading) {
      return
    }

    setAiDialogOpen(false)
    setAiSubmittedQuery(queryText)
    setAiFilters(null)
    setAiProperties([])
    setAiCount(0)
    setAiError("")
    setAiLoading(true)

    window.setTimeout(
      () => aiResultsRef.current?.scrollIntoView({ behavior: "smooth" }),
      50
    )

    try {
      const extraction = await apiFetch<HouseAiSearchResponse>(
        "/api/immovables/public/maisons/ai-search/",
        {
          body: JSON.stringify({ query: queryText }),
          headers: jsonHeaders(),
          method: "POST",
        }
      )

      if (!extraction.success || !extraction.filters) {
        throw new Error("La recherche n’a pas pu être comprise.")
      }

      const filterQuery = buildHouseAiQuery(extraction.filters)
      const response = await apiFetch<PublicImmovablesResponse>(
        `/api/immovables/public/maisons/${filterQuery ? `?${filterQuery}` : ""}`
      )
      const parsed = parsePublicImmovables(response)

      setAiFilters(extraction.filters)
      setAiProperties(parsed.properties)
      setAiCount(parsed.count)
    } catch (caughtError) {
      const fallback =
        "La recherche n’a pas pu aboutir. Réessayez dans un instant."

      if (caughtError instanceof ApiError) {
        setAiError(
          safeErrorMessage(
            formatApiMessage(caughtError.body, fallback),
            fallback
          )
        )
      } else {
        setAiError(
          safeErrorMessage(
            caughtError instanceof Error ? caughtError.message : fallback,
            fallback
          )
        )
      }
    } finally {
      setAiLoading(false)
    }
  }

  function clearAiSearch() {
    setAiSubmittedQuery("")
    setAiFilters(null)
    setAiProperties([])
    setAiCount(0)
    setAiError("")
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-svh overflow-x-hidden bg-background text-foreground">
        <section className="bg-brand-navy text-brand-white">
          <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-9 px-4 py-10 sm:px-8 sm:py-14 lg:px-10">
            <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
              <div className="max-w-3xl min-w-0 space-y-6">
                <HomelinkLogo
                  priority
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 320px, 80vw"
                  className="h-24 w-full max-w-[20rem] sm:h-28 sm:max-w-[24rem]"
                />
                <div className="space-y-4">
                  <h1 className="max-w-[22rem] text-[1.75rem] leading-tight font-semibold break-words sm:max-w-3xl sm:text-5xl lg:text-6xl">
                    Trouvez le bien qui cadre avec votre projet.
                  </h1>
                  <p className="max-w-full text-base leading-7 text-white/78 sm:max-w-2xl sm:text-lg">
                    Appartements, maisons, bureaux, hôtels, kiosques, terrains
                    et salles événement sont regroupés dans une recherche simple
                    à affiner selon vos critères.
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

            {aiSubmittedQuery ? (
              <section
                ref={aiResultsRef}
                aria-labelledby="ai-results-title"
                className="scroll-mt-24 space-y-5 border-y border-primary/20 bg-background/70 py-6 sm:px-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="size-5 shrink-0" />
                      <h2
                        id="ai-results-title"
                        className="text-xl font-semibold text-foreground sm:text-2xl"
                      >
                        Maisons sélectionnées pour vous
                      </h2>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      « {aiSubmittedQuery} »
                    </p>
                    {!aiLoading && !aiError ? (
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {aiCount} résultat{aiCount === 1 ? "" : "s"}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    onClick={clearAiSearch}
                  >
                    <X />
                    <span className="sr-only">Fermer les résultats</span>
                  </Button>
                </div>

                {aiFilterLabels.length > 0 && !aiLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {aiFilterLabels.map((label) => (
                      <span
                        key={label}
                        className="rounded-md border border-primary/20 bg-secondary px-2.5 py-1.5 text-xs font-medium text-primary"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}

                {aiLoading ? (
                  <ResultsSkeleton />
                ) : aiError ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
                    <p className="font-medium">
                      Oups, la recherche n’a pas pu aboutir.
                    </p>
                    <p className="mt-1 text-destructive/80">{aiError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => setAiDialogOpen(true)}
                    >
                      <RefreshCw />
                      Réessayer
                    </Button>
                  </div>
                ) : aiProperties.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {aiProperties.map((property) => (
                      <PropertyCard
                        key={
                          property.id ??
                          property.reference ??
                          property.detail_url
                        }
                        property={property}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border px-5 py-8 text-center">
                    <Home className="mx-auto size-8 text-primary" />
                    <h3 className="mt-3 text-lg font-semibold">
                      Aucune maison ne correspond encore
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => setAiDialogOpen(true)}
                    >
                      <Search />
                      Modifier la recherche
                    </Button>
                  </div>
                )}
              </section>
            ) : null}

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
              <ResultsSkeleton />
            ) : hasResults ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => (
                  <PropertyCard
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
      {!aiDialogOpen ? (
        <Button
          type="button"
          className="fixed right-4 bottom-4 z-40 size-12 gap-2 rounded-full p-0 shadow-xl sm:right-6 sm:bottom-6 sm:h-12 sm:w-auto sm:px-4"
          aria-label="Ouvrir la recherche IA"
          aria-expanded={aiDialogOpen}
          aria-controls="house-ai-search-dialog"
          onClick={() => setAiDialogOpen(true)}
        >
          <Sparkles className="size-5" />
          <span className="hidden sm:inline">Recherche IA</span>
        </Button>
      ) : null}

      {aiDialogOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-brand-navy/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="house-ai-search-title"
          id="house-ai-search-dialog"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setAiDialogOpen(false)
            }
          }}
        >
          <div className="w-full rounded-t-lg border border-border bg-card text-card-foreground shadow-2xl sm:max-w-lg sm:rounded-lg">
            <div className="flex items-center justify-between gap-4 border-b border-border p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                  <Sparkles className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2
                    id="house-ai-search-title"
                    className="text-lg font-semibold"
                  >
                    Recherche de maison
                  </h2>
                  <p className="text-sm text-muted-foreground">Maisons</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setAiDialogOpen(false)}
              >
                <X />
                <span className="sr-only">Fermer</span>
              </Button>
            </div>

            <form onSubmit={submitAiSearch} className="space-y-4 p-4 sm:p-5">
              <label className="grid gap-2 text-sm font-medium">
                Votre recherche
                <textarea
                  ref={aiInputRef}
                  value={aiQuery}
                  onChange={(event) => setAiQuery(event.target.value)}
                  placeholder="Je cherche une maison à Gombe de plus de 3 chambres"
                  rows={4}
                  className="min-h-28 w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-base leading-6 outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30"
                />
              </label>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAiDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={!aiQuery.trim() || aiLoading}>
                  {aiLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Sparkles />
                  )}
                  Rechercher
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      <SiteFooter />
    </>
  )
}

export { HomeContent }

import { publicTransactionOptions } from "@/lib/public-immovables"

export type HouseAiFilterValue = boolean | number | string | null

export type HouseAiFilters = {
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
}

export type HouseAiSearchResponse = {
  filters?: HouseAiFilters | null
  success?: boolean
  error?: string
  code?: string
}

export const houseAiFilterKeys = [
  "type_bien",
  "type_transaction",
  "commune",
  "quartier",
  "min_price",
  "max_price",
  "chamber_number",
  "min_chamber_number",
  "max_chamber_number",
  "bathroom_number",
  "garden",
  "garage",
  "pool",
  "terrace",
  "devise",
] as const satisfies ReadonlyArray<keyof HouseAiFilters>

const booleanLabels: Partial<
  Record<keyof HouseAiFilters, readonly [string, string]>
> = {
  garage: ["Avec garage", "Sans garage"],
  garden: ["Avec jardin", "Sans jardin"],
  pool: ["Avec piscine", "Sans piscine"],
  terrace: ["Avec terrasse", "Sans terrasse"],
}

function hasValue(value: HouseAiFilterValue | undefined) {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase()

    return (
      normalizedValue !== "" &&
      normalizedValue !== "null" &&
      normalizedValue !== "undefined" &&
      normalizedValue !== "none"
    )
  }

  return true
}

function queryMentionsPrice(userQuery: string) {
  const normalizedQuery = userQuery.toLowerCase()

  return (
    /\d/.test(normalizedQuery) ||
    /\b(prix|budget|loyer|dollar|dollars|usd|cdf|franc|fc)\b/.test(
      normalizedQuery
    )
  )
}

export function normalizeHouseAiFilters(
  userQuery: string,
  filters: HouseAiFilters
) {
  const nextFilters: HouseAiFilters = {}

  houseAiFilterKeys.forEach((key) => {
    const value = filters[key]

    if (hasValue(value)) {
      nextFilters[key] = value
    }
  })

  if (!queryMentionsPrice(userQuery)) {
    delete nextFilters.min_price
    delete nextFilters.max_price
    delete nextFilters.devise
  }

  return nextFilters
}

export function buildHouseAiQuery(filters: HouseAiFilters) {
  const params = new URLSearchParams()

  houseAiFilterKeys.forEach((key) => {
    const value = filters[key]

    if (hasValue(value)) {
      params.set(key, String(value))
    }
  })

  return params.toString()
}

export function buildHouseAiResultsPath(
  userQuery: string,
  filters: HouseAiFilters
) {
  const normalizedFilters = normalizeHouseAiFilters(userQuery, filters)
  const params = new URLSearchParams(buildHouseAiQuery(normalizedFilters))

  params.set("q", userQuery)

  return `/recherche-ia?${params.toString()}`
}

function filterLabel(
  key: keyof HouseAiFilters,
  value: HouseAiFilterValue | undefined
) {
  if (!hasValue(value) || key === "type_bien") {
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

  const labels = booleanLabels[key]

  if (labels && typeof value === "boolean") {
    return labels[value ? 0 : 1]
  }

  return ""
}

export function houseAiFilterLabels(filters: HouseAiFilters) {
  return houseAiFilterKeys
    .map((key) => filterLabel(key, filters[key]))
    .filter(Boolean)
}

export function parseHouseAiFilterValue(value: string) {
  const trimmed = value.trim()
  const normalizedValue = trimmed.toLowerCase()

  if (
    normalizedValue === "" ||
    normalizedValue === "null" ||
    normalizedValue === "undefined" ||
    normalizedValue === "none"
  ) {
    return null
  }

  if (normalizedValue === "true") {
    return true
  }

  if (normalizedValue === "false") {
    return false
  }

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const num = Number(trimmed)
    if (!isNaN(num)) {
      return num
    }
  }

  return value
}

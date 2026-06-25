export type PublicAgencyLocation = {
  city?: string | null
  country?: string | null
  display_address?: string | null
  neighborhood?: string | null
}

export type PublicAgencyAddress = {
  city?: string | null
  complement_adresse?: string | null
  country?: { id?: number; name?: string | null; iso2?: string | null } | null
  display_address?: string | null
  formatted_address?: string | null
  neighborhood?: string | null
  postal_code?: string | null
  state?: string | null
  street?: string | null
}

export type PublicAgency = {
  address?: PublicAgencyAddress | null
  cover_image?: string | null
  created_at?: string | null
  description?: string | null
  detail_url?: string | null
  email?: string | null
  id?: number | string | null
  is_verified?: boolean | null
  legal_name?: string | null
  legal_status?: string | null
  legal_status_label?: string | null
  location?: PublicAgencyLocation | null
  logo?: string | null
  name?: string | null
  phone?: string | null
  properties_count?: number | null
  slug?: string | null
  updated_at?: string | null
  verified_at?: string | null
  website?: string | null
}

export type PublicAgenciesResponse =
  | PublicAgency[]
  | {
      count?: number
      results?: PublicAgency[]
    }

export type PublicAgencyFilters = {
  search: string
  is_verified: string
  has_website: string
  sort_by: string
  sort_order: string
}

export const initialPublicAgencyFilters: PublicAgencyFilters = {
  search: "",
  is_verified: "",
  has_website: "",
  sort_by: "created_at",
  sort_order: "desc",
}

export const publicAgencySortOptions = [
  { label: "Plus récentes", value: "created_at" },
  { label: "Nom", value: "name" },
  { label: "Vérification", value: "is_verified" },
  { label: "Nombre de biens", value: "properties_count" },
]

function compact(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value?.trim()))
}

function normalizeAssetPath(asset?: string | null) {
  const value = asset?.trim()

  if (!value) {
    return ""
  }

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return `/api/proxy/${value.replace(/^\/+/, "")}`
}

export function parsePublicAgencies(response: PublicAgenciesResponse) {
  if (Array.isArray(response)) {
    return {
      agencies: response,
      count: response.length,
    }
  }

  const agencies = Array.isArray(response.results) ? response.results : []

  return {
    agencies,
    count: typeof response.count === "number" ? response.count : agencies.length,
  }
}

export function buildPublicAgenciesQuery(filters: PublicAgencyFilters) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    const normalizedValue = value.trim()

    if (normalizedValue) {
      params.set(key, normalizedValue)
    }
  })

  return params.toString()
}

export function publicAgencyName(agency: PublicAgency) {
  return agency.name?.trim() || "Agence immobilière"
}

export function publicAgencySlug(agency: PublicAgency) {
  return agency.slug?.trim() || ""
}

export function publicAgencyDetailPath(agency: PublicAgency) {
  const slug = publicAgencySlug(agency)

  return slug ? `/agences/${encodeURIComponent(slug)}` : ""
}

export function publicAgencyAddressLabel(agency: PublicAgency) {
  const address = agency.address
  const location = agency.location

  return (
    address?.display_address ||
    address?.formatted_address ||
    location?.display_address ||
    compact([
      address?.street,
      address?.neighborhood || location?.neighborhood,
      address?.city || location?.city,
      address?.state,
      address?.country?.name || location?.country,
    ]).join(", ") ||
    "Adresse à préciser"
  )
}

export function publicAgencyLogo(agency: PublicAgency) {
  return normalizeAssetPath(agency.logo)
}

export function publicAgencyCover(agency: PublicAgency) {
  return normalizeAssetPath(agency.cover_image || agency.logo)
}

export function publicAgencyPropertiesLabel(agency: PublicAgency) {
  const count = agency.properties_count ?? 0

  return `${count} bien${count > 1 ? "s" : ""}`
}

export function publicAgencyVerifiedLabel(agency: PublicAgency) {
  return agency.is_verified ? "Agence vérifiée" : "Vérification en attente"
}

export function publicAgencyWebsiteHref(agency: PublicAgency) {
  const website = agency.website?.trim()

  if (!website) {
    return ""
  }

  return /^https?:\/\//i.test(website) ? website : `https://${website}`
}

type AgencyOwner = {
  email?: string | null
  first_name?: string | null
  id?: string
  last_name?: string | null
  phone_number?: string | null
}

type Agency = {
  address?: unknown
  administrative_area?: string | null
  business_registration_document?: string | null
  country?: string | null
  cover_image?: string | null
  created_at?: string | null
  description?: string | null
  email?: string | null
  id?: number | string
  is_active?: boolean | null
  is_verified?: boolean | null
  legal_name?: string | null
  legal_status?: string | null
  locality?: string | null
  logo?: string | null
  name?: string | null
  national_id_document?: string | null
  owner?: AgencyOwner | null
  phone?: string | null
  proof_of_address?: string | null
  rccm_number?: string | null
  slug?: string | null
  sub_locality?: string | null
  tax_document?: string | null
  tax_number?: string | null
  updated_at?: string | null
  uuid?: string
  verification_message?: string | null
  verification_status?: string | null
  verified_at?: string | null
  website?: string | null
}

type AgenciesResponse =
  | Agency[]
  | {
      count?: number
      data?: Agency[]
      results?: Agency[]
    }

const legalStatusLabels: Record<string, string> = {
  individual: "Entreprise individuelle",
  ong: "ONG",
  other: "Autre",
  sa: "SA",
  sarl: "SARL",
  sas: "SAS",
}

const verificationStatusLabels: Record<string, string> = {
  approved: "Approuvee",
  pending: "En attente",
  rejected: "Rejetee",
  verified: "Verifiee",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseAgencies(response: AgenciesResponse) {
  if (Array.isArray(response)) {
    return {
      agencies: response,
      count: response.length,
    }
  }

  const agencies = response.results ?? response.data ?? []

  return {
    agencies,
    count: response.count ?? agencies.length,
  }
}

function toText(value: unknown) {
  if (typeof value === "string") {
    return value.trim()
  }

  if (typeof value === "number") {
    return String(value)
  }

  return ""
}

function pickText(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const text = toText(source[key])

    if (text) {
      return text
    }
  }

  return ""
}

function entityName(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return toText(value)
  }

  if (isRecord(value)) {
    return pickText(value, ["name", "label", "title"])
  }

  return ""
}

function addressObjectLabel(address: unknown) {
  if (!address) {
    return ""
  }

  if (typeof address === "string" || typeof address === "number") {
    return ""
  }

  if (!isRecord(address)) {
    return ""
  }

  const parts = [
    pickText(address, ["street", "address", "line1"]),
    entityName(address.sub_locality) ||
      pickText(address, ["sub_locality_name", "sub_locality"]),
    entityName(address.locality) || pickText(address, ["locality_name"]),
    entityName(address.administrative_area) ||
      pickText(address, ["administrative_area_name"]),
    entityName(address.country) || pickText(address, ["country_name"]),
  ].filter(Boolean)

  return parts.join(", ")
}

function agencyAddressLabel(agency: Agency) {
  const address = addressObjectLabel(agency.address)

  if (address) {
    return address
  }

  const parts = [
    agency.sub_locality,
    agency.locality,
    agency.administrative_area,
    agency.country,
  ]
    .map(toText)
    .filter(Boolean)

  return parts.length > 0 ? parts.join(", ") : "-"
}

function legalStatusLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return legalStatusLabels[value] ?? value
}

function statusLabel(value?: boolean | null) {
  if (value === false) {
    return "Inactive"
  }

  return "Active"
}

function verificationStatusLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return verificationStatusLabels[value] ?? value
}

function yesNoLabel(value?: boolean | null) {
  return value ? "Oui" : "Non"
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

function createdDateLabel(value?: string | null) {
  const date = formatDate(value)

  return date === "-" ? "Date non disponible" : `Cree le ${date}`
}

function agencyDisplayName(agency: Agency) {
  return agency.name?.trim() || "Agence sans nom"
}

function agencyOwnerName(owner?: AgencyOwner | null) {
  if (!owner) {
    return "-"
  }

  const name = [owner.first_name, owner.last_name]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join(" ")

  return name || owner.email || "-"
}

function agencySlug(agency: Agency) {
  return agency.slug?.trim() || ""
}

function agencyDetailPath(slug: string) {
  return `/dashboard/agencies/${encodeURIComponent(slug)}`
}

export {
  agencyAddressLabel,
  agencyDetailPath,
  agencyDisplayName,
  agencyOwnerName,
  agencySlug,
  createdDateLabel,
  formatDate,
  legalStatusLabel,
  parseAgencies,
  statusLabel,
  verificationStatusLabel,
  yesNoLabel,
  type AgenciesResponse,
  type Agency,
}

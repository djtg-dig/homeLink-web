type BureauAddress = {
  administrative_area?: number | string | null
  city?: string | null
  complement_adresse?: string | null
  country?: string | null
  formatted_address?: string | null
  id?: number | string
  neighborhood?: string | null
  postal_code?: string | null
  proximite_transports?: string | null
  state?: string | null
  street?: string | null
}

type BureauAgency = {
  id?: number | string
  is_active?: boolean | null
  is_verified?: boolean | null
  name?: string | null
  slug?: string | null
  verification_status?: string | null
}

type BureauOwner = {
  email?: string | null
  full_name?: string | null
  phone_number?: string | null
}

type BureauDetails = {
  alarm?: boolean | null
  area?: number | string | null
  available_from?: string | null
  batiment?: number | string | null
  charges?: number | string | null
  condition?: string | null
  deposit_months?: number | string | null
  digicode?: boolean | null
  door_number?: string | null
  floor_number?: number | string | null
  floor_plan?: string | null
  furniture_description?: string | null
  furniture_included?: boolean | null
  has_false_ceiling?: boolean | null
  has_individual_ac?: boolean | null
  has_individual_heating?: boolean | null
  has_private_bathroom?: boolean | null
  has_private_entrance?: boolean | null
  has_private_kitchen?: boolean | null
  has_private_terrace?: boolean | null
  has_raised_floor?: boolean | null
  has_wifi?: boolean | null
  interphone?: boolean | null
  is_available?: boolean | null
  lease_type?: string | null
  max_capacity?: number | string | null
  minimum_lease_months?: number | string | null
  monthly_rent?: number | string | null
  network_ports?: number | string | null
  office_type?: string | null
  open_space_area?: number | string | null
  private_offices_count?: number | string | null
  recommended_capacity?: number | string | null
  virtual_tour_url?: string | null
  watch_camera?: boolean | null
  wing?: string | null
}

type Bureau = {
  adresse?: BureauAddress | null
  agency?: BureauAgency | null
  bureau?: BureauDetails | null
  created_at?: string | null
  description?: string | null
  est_proprietaire?: boolean | null
  id?: number | string
  is_active?: boolean | null
  owner?: BureauOwner | null
  prix_affiche?: string | null
  prix_location_mensuel?: number | string | null
  prix_vente?: number | string | null
  reference?: string | null
  statut?: string | null
  surface_habitable?: number | string | null
  surface_totale?: number | string | null
  title?: string | null
  type_transaction?: string | null
  updated_at?: string | null
}

type BureauxResponse =
  | Bureau[]
  | {
      count?: number
      data?: Bureau[]
      results?: Bureau[]
    }

const statutLabels: Record<string, string> = {
  disponible: "Disponible",
  indisponible: "Indisponible",
  loue: "Loué",
  reserve: "Réservé",
  vendu: "Vendu",
}

const transactionLabels: Record<string, string> = {
  location: "Location",
  vente: "Vente",
}

const officeTypeLabels: Record<string, string> = {
  coworking: "Coworking",
  open_space: "Open space",
  private_office: "Bureau privé",
  shared_office: "Bureau partagé",
}

const conditionLabels: Record<string, string> = {
  a_renover: "À rénover",
  bon_etat: "Bon état",
  neuf: "Neuf",
  renove: "Rénové",
}

const leaseTypeLabels: Record<string, string> = {
  meuble: "Meublé",
  nu: "Nu",
  flexible: "Flexible",
}

function parseBureaux(response: BureauxResponse) {
  if (Array.isArray(response)) {
    return {
      bureaux: response,
      count: response.length,
    }
  }

  const bureaux = response.results ?? response.data ?? []

  return {
    bureaux,
    count: response.count ?? bureaux.length,
  }
}

function textValue(value: unknown) {
  if (typeof value === "string") {
    return value.trim()
  }

  if (typeof value === "number") {
    return String(value)
  }

  return ""
}

function textOrDash(value: unknown) {
  return textValue(value) || "-"
}

function bureauId(bureau: Bureau) {
  return bureau.id === undefined || bureau.id === null ? "" : String(bureau.id)
}

function bureauDisplayName(bureau: Bureau) {
  return bureau.title?.trim() || bureau.reference?.trim() || "Bureau sans titre"
}

function bureauReferenceLabel(bureau: Bureau) {
  return bureau.reference?.trim() || "Référence non disponible"
}

function bureauAddressLabel(bureau: Bureau) {
  const address = bureau.adresse

  if (!address) {
    return "-"
  }

  const formatted = address.formatted_address?.trim()

  if (formatted) {
    return formatted
  }

  const parts = [
    address.street,
    address.neighborhood,
    address.city,
    address.state,
    address.country,
  ]
    .map(textValue)
    .filter(Boolean)

  return parts.length > 0 ? parts.join(", ") : "-"
}

function statusLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return statutLabels[value] ?? value
}

function transactionLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return transactionLabels[value] ?? value
}

function officeTypeLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return officeTypeLabels[value] ?? value
}

function conditionLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return conditionLabels[value] ?? value
}

function leaseTypeLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return leaseTypeLabels[value] ?? value
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

  return date === "-" ? "Date non disponible" : `Créé le ${date}`
}

function priceLabel(bureau: Bureau) {
  const displayPrice = bureau.prix_affiche?.trim()

  if (displayPrice) {
    return displayPrice
  }

  if (bureau.type_transaction === "location") {
    const rent = textValue(bureau.prix_location_mensuel)

    return rent ? `${rent} / mois` : "-"
  }

  return textOrDash(bureau.prix_vente)
}

function surfaceLabel(value?: number | string | null) {
  const text = textValue(value)

  return text ? `${text} m²` : "-"
}

function agencyName(bureau: Bureau) {
  return bureau.agency?.name?.trim() || "Sans agence"
}

export {
  agencyName,
  bureauAddressLabel,
  bureauDisplayName,
  bureauId,
  bureauReferenceLabel,
  conditionLabel,
  createdDateLabel,
  formatDate,
  leaseTypeLabel,
  officeTypeLabel,
  parseBureaux,
  priceLabel,
  statusLabel,
  surfaceLabel,
  textOrDash,
  transactionLabel,
  type Bureau,
  type BureauAddress,
  type BureauAgency,
  type BureauDetails,
  type BureauOwner,
  type BureauxResponse,
}

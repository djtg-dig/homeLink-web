type SalleEvenementAddress = {
  administrative_area?: number | string | null
  city?: string | null
  complement_adresse?: string | null
  country?: string | null
  formatted_address?: string | null
  id?: number | string
  latitude?: number | string | null
  locality?: number | string | null
  longitude?: number | string | null
  neighborhood?: string | null
  postal_code?: string | null
  proximite_transports?: string | null
  state?: string | null
  street?: string | null
  sub_locality?: number | string | null
}

type SalleEvenementOwner = {
  email?: string | null
  full_name?: string | null
  phone_number?: string | null
}

type SalleEvenementDetails = {
  capacite_max?: number | string | null
  description_equipements?: string | null
  has_air_conditioning?: boolean | null
  has_generator?: boolean | null
  has_kitchen?: boolean | null
  has_lighting_system?: boolean | null
  has_parking?: boolean | null
  has_projector?: boolean | null
  has_security_service?: boolean | null
  has_sound_system?: boolean | null
  has_stage?: boolean | null
  has_tables_chairs?: boolean | null
  has_toilets?: boolean | null
  is_furnished?: boolean | null
  nombre_salles?: number | string | null
  salle_type?: string | null
  surface_salle?: number | string | null
}

type SalleEvenement = {
  adresse?: SalleEvenementAddress | null
  created_at?: string | null
  description?: string | null
  est_proprietaire?: boolean | null
  id?: number | string
  is_active?: boolean | null
  owner?: SalleEvenementOwner | null
  prix_affiche?: string | null
  prix_location_mensuel?: number | string | null
  reference?: string | null
  salle_evenement?: SalleEvenementDetails | null
  statut?: string | null
  surface_totale?: number | string | null
  title?: string | null
  type_transaction?: string | null
  updated_at?: string | null
}

type SallesEvenementResponse =
  | SalleEvenement[]
  | {
      count?: number
      data?: SalleEvenement[]
      results?: SalleEvenement[]
    }

const statutLabels: Record<string, string> = {
  disponible: "Disponible",
  indisponible: "Indisponible",
  loue: "Loué",
  reserve: "Réservé",
}

const transactionLabels: Record<string, string> = {
  location: "Location",
}

const salleTypeLabels: Record<string, string> = {
  conference: "Conférence",
  mariage: "Mariage",
  polyvalente: "Polyvalente",
  reunion: "Réunion",
  spectacle: "Spectacle",
}

function parseSallesEvenement(response: SallesEvenementResponse) {
  if (Array.isArray(response)) {
    return {
      count: response.length,
      salles: response,
    }
  }

  const salles = response.results ?? response.data ?? []

  return {
    count: response.count ?? salles.length,
    salles,
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

function salleEvenementId(salle: SalleEvenement) {
  return salle.id === undefined || salle.id === null ? "" : String(salle.id)
}

function salleEvenementDisplayName(salle: SalleEvenement) {
  return salle.title?.trim() || salle.reference?.trim() || "Salle sans titre"
}

function salleEvenementReferenceLabel(salle: SalleEvenement) {
  return salle.reference?.trim() || "Référence non disponible"
}

function salleEvenementAddressLabel(salle: SalleEvenement) {
  const address = salle.adresse

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

function salleTypeLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return salleTypeLabels[value] ?? value
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

function priceLabel(salle: SalleEvenement) {
  const displayPrice = salle.prix_affiche?.trim()

  if (displayPrice) {
    return displayPrice
  }

  const rent = textValue(salle.prix_location_mensuel)

  return rent ? `${rent} / mois` : "-"
}

function surfaceLabel(value?: number | string | null) {
  const text = textValue(value)

  return text ? `${text} m²` : "-"
}

function capacityLabel(value?: number | string | null) {
  const text = textValue(value)

  return text ? `${text} personnes` : "-"
}

export {
  capacityLabel,
  createdDateLabel,
  parseSallesEvenement,
  priceLabel,
  salleEvenementAddressLabel,
  salleEvenementDisplayName,
  salleEvenementId,
  salleEvenementReferenceLabel,
  salleTypeLabel,
  statusLabel,
  surfaceLabel,
  textValue,
  transactionLabel,
  type SalleEvenement,
  type SalleEvenementAddress,
  type SalleEvenementDetails,
  type SalleEvenementOwner,
  type SallesEvenementResponse,
}

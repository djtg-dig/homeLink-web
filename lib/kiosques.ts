type KiosqueAddress = {
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

type KiosqueOwner = {
  email?: string | null
  full_name?: string | null
  phone_number?: string | null
}

type KiosqueDetails = {
  description_equipements?: string | null
  has_electricity?: boolean | null
  has_security_grid?: boolean | null
  has_storage?: boolean | null
  has_water?: boolean | null
  is_furnished?: boolean | null
  is_movable?: boolean | null
  kiosque_type?: string | null
  opening_side_count?: number | string | null
  surface?: number | string | null
}

type Kiosque = {
  adresse?: KiosqueAddress | null
  created_at?: string | null
  description?: string | null
  est_proprietaire?: boolean | null
  id?: number | string
  is_active?: boolean | null
  kiosque?: KiosqueDetails | null
  owner?: KiosqueOwner | null
  prix_affiche?: string | null
  prix_location_mensuel?: number | string | null
  prix_vente?: number | string | null
  reference?: string | null
  statut?: string | null
  surface_totale?: number | string | null
  title?: string | null
  type_transaction?: string | null
  updated_at?: string | null
}

type KiosquesResponse =
  | Kiosque[]
  | {
      count?: number
      data?: Kiosque[]
      results?: Kiosque[]
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

const kiosqueTypeLabels: Record<string, string> = {
  alimentaire: "Alimentaire",
  autre: "Autre",
  boutique: "Boutique",
  mobile_money: "Mobile money",
  presse: "Presse",
  service: "Service",
}

function parseKiosques(response: KiosquesResponse) {
  if (Array.isArray(response)) {
    return {
      count: response.length,
      kiosques: response,
    }
  }

  const kiosques = response.results ?? response.data ?? []

  return {
    count: response.count ?? kiosques.length,
    kiosques,
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

function kiosqueId(kiosque: Kiosque) {
  return kiosque.id === undefined || kiosque.id === null
    ? ""
    : String(kiosque.id)
}

function kiosqueDisplayName(kiosque: Kiosque) {
  return (
    kiosque.title?.trim() || kiosque.reference?.trim() || "Kiosque sans titre"
  )
}

function kiosqueReferenceLabel(kiosque: Kiosque) {
  return kiosque.reference?.trim() || "Référence non disponible"
}

function kiosqueAddressLabel(kiosque: Kiosque) {
  const address = kiosque.adresse

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

function kiosqueTypeLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return kiosqueTypeLabels[value] ?? value
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

function priceLabel(kiosque: Kiosque) {
  const displayPrice = kiosque.prix_affiche?.trim()

  if (displayPrice) {
    return displayPrice
  }

  if (kiosque.type_transaction === "location") {
    const rent = textValue(kiosque.prix_location_mensuel)

    return rent ? `${rent} / mois` : "-"
  }

  const price = textValue(kiosque.prix_vente)

  return price || "-"
}

function surfaceLabel(value?: number | string | null) {
  const text = textValue(value)

  return text ? `${text} m²` : "-"
}

export {
  createdDateLabel,
  kiosqueAddressLabel,
  kiosqueDisplayName,
  kiosqueId,
  kiosqueReferenceLabel,
  kiosqueTypeLabel,
  parseKiosques,
  priceLabel,
  statusLabel,
  surfaceLabel,
  textValue,
  transactionLabel,
  type Kiosque,
  type KiosqueAddress,
  type KiosqueDetails,
  type KiosqueOwner,
  type KiosquesResponse,
}

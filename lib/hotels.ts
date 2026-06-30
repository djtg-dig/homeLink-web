type HotelAddress = {
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

type HotelOwner = {
  email?: string | null
  full_name?: string | null
  phone_number?: string | null
}

type HotelDetails = {
  description_equipements?: string | null
  has_bar?: boolean | null
  has_conference_room?: boolean | null
  has_garden?: boolean | null
  has_generator?: boolean | null
  has_laundry?: boolean | null
  has_parking?: boolean | null
  has_pool?: boolean | null
  has_reception?: boolean | null
  has_restaurant?: boolean | null
  has_security_service?: boolean | null
  has_wifi?: boolean | null
  hotel_type?: string | null
  is_furnished?: boolean | null
  is_operational?: boolean | null
  nombre_chambres?: number | string | null
  nombre_etages?: number | string | null
  nombre_lits_total?: number | string | null
  nombre_salles_bain?: number | string | null
  standing?: string | null
  star_rating?: number | string | null
}

type Hotel = {
  adresse?: HotelAddress | null
  created_at?: string | null
  description?: string | null
  est_proprietaire?: boolean | null
  hotel?: HotelDetails | null
  id?: number | string
  is_active?: boolean | null
  owner?: HotelOwner | null
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

type HotelsResponse =
  | Hotel[]
  | {
      count?: number
      data?: Hotel[]
      results?: Hotel[]
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

const hotelTypeLabels: Record<string, string> = {
  hotel_simple: "Hôtel simple",
}

const standingLabels: Record<string, string> = {
  standard: "Standard",
}

function parseHotels(response: HotelsResponse) {
  if (Array.isArray(response)) {
    return {
      count: response.length,
      hotels: response,
    }
  }

  const hotels = response.results ?? response.data ?? []

  return {
    count: response.count ?? hotels.length,
    hotels,
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

function hotelId(hotel: Hotel) {
  return hotel.id === undefined || hotel.id === null ? "" : String(hotel.id)
}

function hotelDetailPath(id: string) {
  return `/dashboard/hotels/${encodeURIComponent(id)}`
}

function hotelEditPath(id: string) {
  return `${hotelDetailPath(id)}?mode=edit`
}

function hotelDisplayName(hotel: Hotel) {
  return hotel.title?.trim() || hotel.reference?.trim() || "Hôtel sans titre"
}

function hotelReferenceLabel(hotel: Hotel) {
  return hotel.reference?.trim() || "Référence non disponible"
}

function hotelAddressLabel(hotel: Hotel) {
  const address = hotel.adresse

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

function hotelTypeLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return hotelTypeLabels[value] ?? value
}

function standingLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return standingLabels[value] ?? value
}

function booleanLabel(value?: boolean | null) {
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

  return date === "-" ? "Date non disponible" : `Créé le ${date}`
}

function priceLabel(hotel: Hotel) {
  const displayPrice = hotel.prix_affiche?.trim()

  if (displayPrice) {
    return displayPrice
  }

  if (hotel.type_transaction === "location") {
    const rent = textValue(hotel.prix_location_mensuel)

    return rent ? `${rent} / mois` : "-"
  }

  const price = textValue(hotel.prix_vente)

  return price || "-"
}

function surfaceLabel(value?: number | string | null) {
  const text = textValue(value)

  return text ? `${text} m²` : "-"
}

function roomLabel(value?: number | string | null) {
  const text = textValue(value)

  return text ? `${text} chambres` : "-"
}

export {
  booleanLabel,
  createdDateLabel,
  formatDate,
  hotelAddressLabel,
  hotelDetailPath,
  hotelEditPath,
  hotelDisplayName,
  hotelId,
  hotelReferenceLabel,
  hotelTypeLabel,
  parseHotels,
  priceLabel,
  roomLabel,
  standingLabel,
  statusLabel,
  surfaceLabel,
  textValue,
  transactionLabel,
  type Hotel,
  type HotelAddress,
  type HotelDetails,
  type HotelOwner,
  type HotelsResponse,
}

type AppartementAddress = {
  administrative_area?: number | string | null
  city?: string | null
  complement_adresse?: string | null
  country?: string | null
  created_at?: string | null
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
  updated_at?: string | null
}

type AppartementAgency = {
  id?: number | string
  is_active?: boolean | null
  is_verified?: boolean | null
  name?: string | null
  slug?: string | null
  verification_status?: string | null
}

type AppartementOwner = {
  email?: string | null
  full_name?: string | null
  phone_number?: string | null
}

type AppartementUnit = {
  balcon?: boolean | null
  cave?: boolean | null
  cheminee?: boolean | null
  classe_energie?: string | null
  climatisation?: boolean | null
  emission_ges?: string | null
  etage?: number | string | null
  immeuble?: number | string | null
  interphone?: boolean | null
  jardin?: boolean | null
  meuble?: boolean | null
  nombre_chambres?: number | string | null
  nombre_pieces?: number | string | null
  nombre_sdb?: number | string | null
  parking?: boolean | null
  piscine?: boolean | null
  superficie?: number | string | null
  superficie_terrasse?: number | string | null
  terrasse?: boolean | null
}

type AppartementMedia = {
  file?: string | null
  id?: number | string
  image?: string | null
  thumbnail?: string | null
  title?: string | null
  url?: string | null
  video?: string | null
}

type Appartement = {
  adresse?: AppartementAddress | null
  agency?: AppartementAgency | null
  appartement?: AppartementUnit | null
  created_at?: string | null
  description?: string | null
  est_proprietaire?: boolean | null
  id?: number | string
  images?: AppartementMedia[]
  is_active?: boolean | null
  main_image?: string | null
  medias?: AppartementMedia[]
  owner?: AppartementOwner | null
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
  videos?: AppartementMedia[]
}

type AppartementsResponse =
  | Appartement[]
  | {
      count?: number
      data?: Appartement[]
      results?: Appartement[]
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

function parseAppartements(response: AppartementsResponse) {
  if (Array.isArray(response)) {
    return {
      appartements: response,
      count: response.length,
    }
  }

  const appartements = response.results ?? response.data ?? []

  return {
    appartements,
    count: response.count ?? appartements.length,
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

function appartementId(appartement: Appartement) {
  return appartement.id === undefined || appartement.id === null
    ? ""
    : String(appartement.id)
}

function appartementDetailPath(id: string) {
  return `/dashboard/appartements/${encodeURIComponent(id)}`
}

function appartementDisplayName(appartement: Appartement) {
  return (
    appartement.title?.trim() ||
    appartement.reference?.trim() ||
    "Appartement sans titre"
  )
}

function appartementReferenceLabel(appartement: Appartement) {
  return appartement.reference?.trim() || "Référence non disponible"
}

function appartementAddressLabel(appartement: Appartement) {
  const address = appartement.adresse

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

function statutLabel(value?: string | null) {
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

function priceLabel(appartement: Appartement) {
  const displayPrice = appartement.prix_affiche?.trim()

  if (displayPrice) {
    return displayPrice
  }

  if (appartement.type_transaction === "location") {
    const rent = textValue(appartement.prix_location_mensuel)

    return rent ? `${rent} / mois` : "-"
  }

  return textOrDash(appartement.prix_vente)
}

function surfaceLabel(value?: number | string | null) {
  const text = textValue(value)

  return text ? `${text} m²` : "-"
}

function agencyName(appartement: Appartement) {
  return appartement.agency?.name?.trim() || "-"
}

function ownerName(appartement: Appartement) {
  return appartement.owner?.full_name?.trim() || "-"
}

function mediaUrl(media: AppartementMedia) {
  return (
    media.url?.trim() ||
    media.thumbnail?.trim() ||
    media.image?.trim() ||
    media.file?.trim() ||
    media.video?.trim() ||
    ""
  )
}

function appartementMediaGallery(appartement: Appartement) {
  const gallery: AppartementMedia[] = []

  if (appartement.main_image?.trim()) {
    gallery.push({
      id: "main-image",
      image: appartement.main_image,
      title: "Photo principale",
    })
  }

  gallery.push(...(appartement.images ?? []))
  gallery.push(...(appartement.medias ?? []))

  const seen = new Set<string>()

  return gallery.filter((media) => {
    const url = mediaUrl(media)

    if (!url || seen.has(url)) {
      return false
    }

    seen.add(url)
    return true
  })
}

export {
  agencyName,
  appartementAddressLabel,
  appartementDetailPath,
  appartementDisplayName,
  appartementId,
  appartementMediaGallery,
  appartementReferenceLabel,
  booleanLabel,
  createdDateLabel,
  formatDate,
  mediaUrl,
  ownerName,
  parseAppartements,
  priceLabel,
  statutLabel,
  surfaceLabel,
  textOrDash,
  transactionLabel,
  type Appartement,
  type AppartementAddress,
  type AppartementAgency,
  type AppartementMedia,
  type AppartementOwner,
  type AppartementUnit,
  type AppartementsResponse,
}

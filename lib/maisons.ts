type MaisonAddress = {
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

type MaisonAgency = {
  id?: number | string
  is_active?: boolean | null
  is_verified?: boolean | null
  name?: string | null
  slug?: string | null
  verification_status?: string | null
}

type MaisonOwner = {
  email?: string | null
  full_name?: string | null
  phone_number?: string | null
}

type MaisonDetails = {
  alarm?: boolean | null
  barbecue?: boolean | null
  bathroom_number?: number | string | null
  building_year?: number | string | null
  cellar?: boolean | null
  chamber_number?: number | string | null
  concierge?: boolean | null
  digicode?: boolean | null
  domotique?: boolean | null
  dpe?: string | null
  elevator?: boolean | null
  energy_class?: string | null
  escapade_kitchen?: boolean | null
  fence?: boolean | null
  fireplace?: boolean | null
  garage?: boolean | null
  garden?: boolean | null
  garden_area?: number | string | null
  garden_shed?: boolean | null
  garner?: boolean | null
  heating?: string | null
  home_cinema?: boolean | null
  home_type?: string | null
  interphone?: boolean | null
  is_isolated?: boolean | null
  isolation?: string | null
  lodger_number?: number | string | null
  place_number_garage?: number | string | null
  pool?: boolean | null
  pool_area?: number | string | null
  premium_material?: boolean | null
  renowned_architect?: string | null
  renovation_need?: boolean | null
  room_sport?: boolean | null
  security_forward_system?: boolean | null
  spa?: boolean | null
  standing?: string | null
  terrace?: boolean | null
  terrace_area?: number | string | null
  unused?: boolean | null
  veranda?: boolean | null
  veranda_area?: number | string | null
  view_sea?: boolean | null
  watch_camera?: boolean | null
}

type Maison = {
  adresse?: MaisonAddress | null
  agency?: MaisonAgency | null
  created_at?: string | null
  description?: string | null
  est_proprietaire?: boolean | null
  id?: number | string
  is_active?: boolean | null
  maison?: MaisonDetails | null
  owner?: MaisonOwner | null
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

type MaisonsResponse =
  | Maison[]
  | {
      count?: number
      data?: Maison[]
      results?: Maison[]
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

const homeTypeLabels: Record<string, string> = {
  chalet: "Chalet",
  contemporaine: "Contemporaine",
  fermette: "Fermette",
  moderne: "Moderne",
  standard: "Standard",
  traditionnelle: "Traditionnelle",
}

const standingLabels: Record<string, string> = {
  haut_standing: "Haut standing",
  luxe: "Luxe",
  standard: "Standard",
}

const heatingLabels: Record<string, string> = {
  bois: "Bois",
  electrique: "Électrique",
  fioul: "Fioul",
  gaz: "Gaz",
  geothermique: "Géothermique",
  none: "Aucun",
  pompe_chaleur: "Pompe à chaleur",
  solaire: "Solaire",
}

const isolationLabels: Record<string, string> = {
  fibre_bois: "Fibre de bois",
  laine_roche: "Laine de roche",
  laine_verre: "Laine de verre",
  liege: "Liège",
  ouate_cellulose: "Ouate de cellulose",
  polystyrene: "Polystyrène",
}

function parseMaisons(response: MaisonsResponse) {
  if (Array.isArray(response)) {
    return {
      count: response.length,
      maisons: response,
    }
  }

  const maisons = response.results ?? response.data ?? []

  return {
    count: response.count ?? maisons.length,
    maisons,
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

function maisonId(maison: Maison) {
  return maison.id === undefined || maison.id === null ? "" : String(maison.id)
}

function maisonDisplayName(maison: Maison) {
  return maison.title?.trim() || maison.reference?.trim() || "Maison sans titre"
}

function maisonReferenceLabel(maison: Maison) {
  return maison.reference?.trim() || "Référence non disponible"
}

function maisonAddressLabel(maison: Maison) {
  const address = maison.adresse

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

function homeTypeLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return homeTypeLabels[value] ?? value
}

function standingLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return standingLabels[value] ?? value
}

function heatingLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return heatingLabels[value] ?? value
}

function isolationLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return isolationLabels[value] ?? value
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

function priceLabel(maison: Maison) {
  const displayPrice = maison.prix_affiche?.trim()

  if (displayPrice) {
    return displayPrice
  }

  if (maison.type_transaction === "location") {
    const rent = textValue(maison.prix_location_mensuel)

    return rent ? `${rent} / mois` : "-"
  }

  const price = textValue(maison.prix_vente)

  return price || "-"
}

function surfaceLabel(value?: number | string | null) {
  const text = textValue(value)

  return text ? `${text} m²` : "-"
}

function agencyName(maison: Maison) {
  return maison.agency?.name?.trim() || "Sans agence"
}

export {
  agencyName,
  createdDateLabel,
  heatingLabel,
  homeTypeLabel,
  isolationLabel,
  maisonAddressLabel,
  maisonDisplayName,
  maisonId,
  maisonReferenceLabel,
  parseMaisons,
  priceLabel,
  standingLabel,
  statusLabel,
  surfaceLabel,
  textValue,
  transactionLabel,
  type Maison,
  type MaisonAddress,
  type MaisonAgency,
  type MaisonDetails,
  type MaisonOwner,
  type MaisonsResponse,
}

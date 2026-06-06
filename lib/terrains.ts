type TerrainAddress = {
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

type TerrainAgency = {
  id?: number | string
  is_active?: boolean | null
  is_verified?: boolean | null
  name?: string | null
  slug?: string | null
  verification_status?: string | null
}

type TerrainOwner = {
  email?: string | null
  full_name?: string | null
  phone_number?: string | null
}

type TerrainDetails = {
  surface_terrain?: number | string | null
  terrain_type?: string | null
  topography?: string | null
}

type Terrain = {
  adresse?: TerrainAddress | null
  agency?: TerrainAgency | null
  created_at?: string | null
  description?: string | null
  est_proprietaire?: boolean | null
  id?: number | string
  is_active?: boolean | null
  owner?: TerrainOwner | null
  prix_affiche?: string | null
  prix_location_mensuel?: number | string | null
  prix_vente?: number | string | null
  reference?: string | null
  statut?: string | null
  surface_habitable?: number | string | null
  surface_totale?: number | string | null
  terrain?: TerrainDetails | null
  title?: string | null
  type_transaction?: string | null
  updated_at?: string | null
}

type TerrainsResponse =
  | Terrain[]
  | {
      count?: number
      data?: Terrain[]
      results?: Terrain[]
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

const terrainTypeLabels: Record<string, string> = {
  beach: "Plage",
  forest: "Forêt",
  mountain: "Montagne",
  terrain: "Terrain",
  urban: "Zone urbaine",
}

const topographyLabels: Record<string, string> = {
  agricultural: "Agricole",
  buildable: "Constructible",
  dense_vegetation: "Végétation dense",
  enfriche: "Zone inondable",
  fallow: "En friche",
  flat: "Plat",
  irrigated: "Agricole irrigué",
  marshy: "Marécageux",
  mountainous: "Zone montagneuse",
  non_buildable: "Non constructible",
  rocky: "Rocheux",
  sandy: "Sablonneux",
  seaside: "Bord de mer",
  sloped: "En pente",
  steep: "Escarpé",
  wooded: "Boisé",
}

function parseTerrains(response: TerrainsResponse) {
  if (Array.isArray(response)) {
    return {
      count: response.length,
      terrains: response,
    }
  }

  const terrains = response.results ?? response.data ?? []

  return {
    count: response.count ?? terrains.length,
    terrains,
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

function terrainId(terrain: Terrain) {
  return terrain.id === undefined || terrain.id === null
    ? ""
    : String(terrain.id)
}

function terrainDisplayName(terrain: Terrain) {
  return (
    terrain.title?.trim() || terrain.reference?.trim() || "Terrain sans titre"
  )
}

function terrainReferenceLabel(terrain: Terrain) {
  return terrain.reference?.trim() || "Référence non disponible"
}

function terrainAddressLabel(terrain: Terrain) {
  const address = terrain.adresse

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

function terrainTypeLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return terrainTypeLabels[value] ?? value
}

function topographyLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return topographyLabels[value] ?? value
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

function priceLabel(terrain: Terrain) {
  const displayPrice = terrain.prix_affiche?.trim()

  if (displayPrice) {
    return displayPrice
  }

  if (terrain.type_transaction === "location") {
    const rent = textValue(terrain.prix_location_mensuel)

    return rent ? `${rent} / mois` : "-"
  }

  const price = textValue(terrain.prix_vente)

  return price || "-"
}

function surfaceLabel(value?: number | string | null) {
  const text = textValue(value)

  return text ? `${text} m²` : "-"
}

function agencyName(terrain: Terrain) {
  return terrain.agency?.name?.trim() || "Sans agence"
}

export {
  agencyName,
  createdDateLabel,
  parseTerrains,
  priceLabel,
  statusLabel,
  surfaceLabel,
  terrainAddressLabel,
  terrainDisplayName,
  terrainId,
  terrainReferenceLabel,
  terrainTypeLabel,
  textValue,
  topographyLabel,
  transactionLabel,
  type Terrain,
  type TerrainAddress,
  type TerrainAgency,
  type TerrainDetails,
  type TerrainOwner,
  type TerrainsResponse,
}

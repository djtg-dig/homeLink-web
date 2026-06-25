export type PublicImmovableAddress = {
  city?: string | null
  country?: string | null
  formatted_address?: string | null
  neighborhood?: string | null
  state?: string | null
  street?: string | null
}

export type PublicImmovableMedia = {
  file?: string | null
  id?: number | string
  image?: string | null
  thumbnail?: string | null
  title?: string | null
  url?: string | null
  video?: string | null
}

export type PublicImmovableOwner = {
  email?: string | null
  full_name?: string | null
  phone_number?: string | null
}

export type PublicImmovable = {
  adresse?: PublicImmovableAddress | null
  appartement?: Record<string, unknown> | null
  bureau?: Record<string, unknown> | null
  created_at?: string | null
  description?: string | null
  detail_url?: string | null
  hotel?: Record<string, unknown> | null
  id?: string | null
  kiosque?: Record<string, unknown> | null
  images?: PublicImmovableMedia[] | null
  main_image?: string | null
  maison?: Record<string, unknown> | null
  medias?: PublicImmovableMedia[] | null
  owner?: PublicImmovableOwner | null
  primary_image_thumbnail?: string | null
  prix_affiche?: string | null
  reference?: string | null
  salle_evenement?: Record<string, unknown> | null
  specific_details?: Record<string, unknown> | null
  statut?: string | null
  surface_habitable?: string | number | null
  surface_totale?: string | number | null
  terrain?: Record<string, unknown> | null
  title?: string | null
  type_bien?: string | null
  type_transaction?: string | null
  videos?: PublicImmovableMedia[] | null
}

export type PublicImmovablesResponse =
  | PublicImmovable[]
  | {
      count?: number
      results?: PublicImmovable[]
    }

export type PublicImmovableFilters = {
  city: string
  has_medias: string
  max_price: string
  max_surface: string
  min_price: string
  min_surface: string
  neighborhood: string
  search: string
  sort_by: string
  sort_order: string
  statut: string
  type_bien: string
  type_transaction: string
}

export const initialPublicImmovableFilters: PublicImmovableFilters = {
  city: "",
  has_medias: "",
  max_price: "",
  max_surface: "",
  min_price: "",
  min_surface: "",
  neighborhood: "",
  search: "",
  sort_by: "created_at",
  sort_order: "desc",
  statut: "",
  type_bien: "",
  type_transaction: "",
}

export const publicTypeOptions = [
  { label: "Appartements", value: "appartement" },
  { label: "Maisons", value: "maison" },
  { label: "Bureaux", value: "bureau" },
  { label: "Terrains", value: "terrain" },
  { label: "Hôtels", value: "hotel" },
  { label: "Kiosques", value: "kiosque" },
  { label: "Salles événement", value: "salle_evenement" },
]

export const publicStatusOptions = [
  { label: "Disponible", value: "disponible" },
  { label: "Sous offre", value: "sous_offre" },
  { label: "Vendu", value: "vendu" },
  { label: "Loué", value: "loue" },
  { label: "Réservé", value: "reserve" },
  { label: "Travaux", value: "travaux" },
]

export const publicTransactionOptions = [
  { label: "Vente", value: "vente" },
  { label: "Location", value: "location" },
  { label: "Saisonnière", value: "saisonniere" },
  { label: "Viager", value: "viager" },
  { label: "Échange", value: "echange" },
]

export const publicSortOptions = [
  { label: "Plus récents", value: "created_at" },
  { label: "Prix", value: "prix_affiche" },
  { label: "Titre", value: "title" },
  { label: "Statut", value: "statut" },
  { label: "Surface", value: "surface_totale" },
]

const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement",
  bureau: "Bureau",
  hotel: "Hôtel",
  kiosque: "Kiosque",
  maison: "Maison",
  salle_evenement: "Salle événement",
  terrain: "Terrain",
}

const DETAIL_KEYS_BY_TYPE: Record<string, keyof PublicImmovable> = {
  appartement: "appartement",
  bureau: "bureau",
  hotel: "hotel",
  kiosque: "kiosque",
  maison: "maison",
  salle_evenement: "salle_evenement",
  terrain: "terrain",
}

const TYPES_BY_REFERENCE_PREFIX: Record<string, string> = {
  APP: "appartement",
  BUR: "bureau",
  HOT: "hotel",
  KIO: "kiosque",
  MAI: "maison",
  SAL: "salle_evenement",
  TER: "terrain",
}

const STATUS_LABELS: Record<string, string> = {
  disponible: "Disponible",
  loue: "Loué",
  reserve: "Réservé",
  sous_offre: "Sous offre",
  travaux: "Travaux",
  vendu: "Vendu",
}

const TRANSACTION_LABELS: Record<string, string> = {
  echange: "Échange",
  location: "Location",
  saisonniere: "Saisonnière",
  vente: "Vente",
  viager: "Viager",
}

const DETAIL_FIELD_LABELS: Record<string, string> = {
  alarm: "Alarme",
  area: "Surface",
  balcon: "Balcon",
  bathroom_number: "Salles de bain",
  capacite_max: "Capacité maximale",
  cave: "Cave",
  chamber_number: "Chambres",
  climatisation: "Climatisation",
  condition: "État",
  digicode: "Digicode",
  description_equipements: "Description des équipements",
  energy_class: "Classe énergétique",
  etage: "Étage",
  floor_number: "Étage",
  garden: "Jardin",
  has_air_conditioning: "Climatisation",
  has_bar: "Bar",
  has_conference_room: "Salle de conférence",
  has_electricity: "Électricité",
  has_generator: "Groupe électrogène",
  has_garden: "Jardin",
  has_kitchen: "Cuisine",
  has_lighting_system: "Éclairage",
  has_parking: "Parking",
  has_pool: "Piscine",
  has_projector: "Projecteur",
  has_reception: "Réception",
  has_restaurant: "Restaurant",
  has_security_grid: "Grille de sécurité",
  has_security_service: "Service de sécurité",
  has_sound_system: "Sonorisation",
  has_stage: "Scène",
  has_storage: "Stockage",
  has_tables_chairs: "Tables et chaises",
  has_toilets: "Toilettes",
  has_water: "Eau",
  has_wifi: "Wi-Fi",
  heating: "Chauffage",
  home_type: "Type de maison",
  hotel_type: "Type d'hôtel",
  immeuble: "Immeuble",
  is_furnished: "Meublé",
  is_movable: "Déplaçable",
  is_operational: "En activité",
  kiosque_type: "Type de kiosque",
  nombre_chambres: "Chambres",
  nombre_etages: "Étages",
  nombre_lits_total: "Lits",
  nombre_pieces: "Pièces",
  nombre_salles: "Salles",
  nombre_salles_bain: "Salles de bain",
  nombre_sdb: "Salles de bain",
  office_type: "Type de bureau",
  parking: "Parking",
  piscine: "Piscine",
  salle_type: "Type de salle",
  standing: "Standing",
  star_rating: "Étoiles",
  superficie: "Superficie",
  superficie_terrasse: "Terrasse",
  surface: "Surface",
  surface_salle: "Surface de salle",
  surface_terrain: "Surface du terrain",
  terrain_type: "Type de terrain",
  topography: "Topographie",
  watch_camera: "Caméras",
}

const DETAIL_VALUE_LABELS: Record<string, Record<string, string>> = {
  heating: {
    bois: "Bois",
    electrique: "Électrique",
    fioul: "Fioul",
    gaz: "Gaz",
    geothermique: "Géothermique",
    none: "Aucun",
    pompe_chaleur: "Pompe à chaleur",
    solaire: "Solaire",
  },
  home_type: {
    chalet: "Chalet",
    contemporaine: "Contemporaine",
    fermette: "Fermette",
    moderne: "Moderne",
    standard: "Standard",
    traditionnelle: "Traditionnelle",
  },
  hotel_type: {
    hotel_simple: "Hôtel simple",
  },
  kiosque_type: {
    alimentaire: "Alimentaire",
    autre: "Autre",
    boutique: "Boutique",
    mobile_money: "Mobile money",
    presse: "Presse",
    service: "Service",
  },
  office_type: {
    coworking: "Coworking",
    open_space: "Open space",
    private_office: "Bureau privé",
    shared_office: "Bureau partagé",
  },
  salle_type: {
    conference: "Conférence",
    mariage: "Mariage",
    polyvalente: "Polyvalente",
    reunion: "Réunion",
    spectacle: "Spectacle",
  },
  standing: {
    haut_standing: "Haut standing",
    luxe: "Luxe",
    standard: "Standard",
  },
  terrain_type: {
    beach: "Plage",
    forest: "Forêt",
    mountain: "Montagne",
    terrain: "Terrain",
    urban: "Zone urbaine",
  },
  topography: {
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
  },
}

type DetailRow =
  | {
      active: boolean
      kind: "boolean"
      label: string
    }
  | {
      kind: "value"
      label: string
      value: string
    }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function compact(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value))
}

function humanizeKey(key: string) {
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function stringValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return ""
  }

  if (typeof value === "boolean") {
    return value ? "Oui" : "Non"
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : ""
  }

  if (typeof value === "string") {
    return value
  }

  return ""
}

function detailValue(key: string, value: unknown) {
  const rawValue = stringValue(value)

  if (!rawValue) {
    return ""
  }

  return DETAIL_VALUE_LABELS[key]?.[rawValue] ?? rawValue
}

function metricValue(value: unknown, unit = "m²") {
  const rawValue = stringValue(value)

  if (!rawValue) {
    return ""
  }

  return `${rawValue} ${unit}`
}

function countValue(value: unknown, singular: string, plural: string) {
  const rawValue = stringValue(value)

  if (!rawValue) {
    return ""
  }

  return `${rawValue} ${rawValue === "1" ? singular : plural}`
}

function mediaCandidate(media: PublicImmovableMedia) {
  return media.thumbnail ?? media.image ?? media.file ?? media.url ?? ""
}

export function publicImmovableType(property: PublicImmovable) {
  if (property.type_bien) {
    return property.type_bien
  }

  for (const [type, key] of Object.entries(DETAIL_KEYS_BY_TYPE)) {
    if (isRecord(property[key])) {
      return type
    }
  }

  const referencePrefix = property.reference?.split("-")[0] ?? ""

  return TYPES_BY_REFERENCE_PREFIX[referencePrefix] ?? ""
}

function publicImmovableSpecificDetails(property: PublicImmovable) {
  if (isRecord(property.specific_details)) {
    return property.specific_details
  }

  const detailKey = DETAIL_KEYS_BY_TYPE[publicImmovableType(property)]

  return detailKey && isRecord(property[detailKey])
    ? (property[detailKey] as Record<string, unknown>)
    : null
}

export function buildPublicImmovablesQuery(filters: PublicImmovableFilters) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    const normalizedValue = value.trim()

    if (normalizedValue) {
      params.set(key, normalizedValue)
    }
  })

  return params.toString()
}

export function parsePublicImmovables(response: PublicImmovablesResponse) {
  if (Array.isArray(response)) {
    return {
      count: response.length,
      properties: response,
    }
  }

  const properties = Array.isArray(response.results) ? response.results : []

  return {
    count:
      typeof response.count === "number" ? response.count : properties.length,
    properties,
  }
}

export function publicImmovableAddressLabel(property: PublicImmovable) {
  const address = property.adresse

  if (!address) {
    return "Adresse à préciser"
  }

  return (
    address.formatted_address ||
    compact([
      address.street,
      address.neighborhood,
      address.city,
      address.state,
      address.country,
    ]).join(", ") ||
    "Adresse à préciser"
  )
}

export function publicImmovableDetailPath(property: PublicImmovable) {
  if (property.id) {
    return `/biens/${encodeURIComponent(property.id)}`
  }

  const match = property.detail_url?.match(/\/public\/([^/]+)\/?$/)

  return match ? `/biens/${encodeURIComponent(match[1])}` : ""
}

export function publicImmovableImage(property: PublicImmovable) {
  const image =
    property.primary_image_thumbnail ||
    property.main_image ||
    property.images?.map(mediaCandidate).find(Boolean) ||
    property.medias?.map(mediaCandidate).find(Boolean) ||
    ""

  if (!image) {
    return ""
  }

  if (/^https?:\/\//i.test(image)) {
    try {
      const url = new URL(image)

      return `/api/proxy/${url.pathname.replace(/^\/+/, "")}${url.search}`
    } catch {
      return ""
    }
  }

  return `/api/proxy/${image.replace(/^\/+/, "")}`
}

export function publicImmovablePriceLabel(property: PublicImmovable) {
  return property.prix_affiche || "Prix sur demande"
}

export function publicImmovableReferenceLabel(property: PublicImmovable) {
  return property.reference || "Référence à venir"
}

export function publicImmovableStatusLabel(property: PublicImmovable) {
  const status = property.statut ?? ""

  return (STATUS_LABELS[status] ?? status) || "Statut à préciser"
}

export function publicImmovableTransactionLabel(property: PublicImmovable) {
  const transaction = property.type_transaction ?? ""

  return (TRANSACTION_LABELS[transaction] ?? transaction) || "Transaction"
}

export function publicImmovableTypeLabel(property: PublicImmovable) {
  const type = publicImmovableType(property)

  return (TYPE_LABELS[type] ?? type) || "Bien"
}

export function publicImmovableTitle(property: PublicImmovable) {
  return property.title || publicImmovableReferenceLabel(property)
}

export function publicImmovableHighlights(property: PublicImmovable) {
  const details = publicImmovableSpecificDetails(property)

  if (!isRecord(details)) {
    return compact([
      metricValue(property.surface_totale),
      metricValue(property.surface_habitable),
    ]).slice(0, 3)
  }

  switch (publicImmovableType(property)) {
    case "appartement":
      return compact([
        countValue(details.nombre_chambres, "chambre", "chambres"),
        countValue(details.nombre_pieces, "pièce", "pièces"),
        metricValue(details.superficie),
      ]).slice(0, 3)
    case "bureau":
      return compact([
        detailValue("office_type", details.office_type),
        metricValue(details.area),
        countValue(details.max_capacity, "place", "places"),
      ]).slice(0, 3)
    case "hotel":
      return compact([
        countValue(details.nombre_chambres, "chambre", "chambres"),
        countValue(details.star_rating, "étoile", "étoiles"),
        detailValue("standing", details.standing),
      ]).slice(0, 3)
    case "kiosque":
      return compact([
        detailValue("kiosque_type", details.kiosque_type),
        metricValue(details.surface),
        countValue(details.opening_side_count, "ouverture", "ouvertures"),
      ]).slice(0, 3)
    case "maison":
      return compact([
        detailValue("home_type", details.home_type),
        countValue(details.chamber_number, "chambre", "chambres"),
        countValue(details.bathroom_number, "salle de bain", "salles de bain"),
      ]).slice(0, 3)
    case "salle_evenement":
      return compact([
        detailValue("salle_type", details.salle_type),
        countValue(details.capacite_max, "personne", "personnes"),
        metricValue(details.surface_salle),
      ]).slice(0, 3)
    case "terrain":
      return compact([
        metricValue(details.surface_terrain),
        detailValue("terrain_type", details.terrain_type),
        detailValue("topography", details.topography),
      ]).slice(0, 3)
    default:
      return publicImmovableDetailRows(property)
        .filter((row) => row.kind === "value")
        .slice(0, 3)
        .map((row) => row.value)
  }
}

export function publicImmovableDetailRows(
  property: PublicImmovable
): DetailRow[] {
  const details = publicImmovableSpecificDetails(property)

  if (!isRecord(details)) {
    return []
  }

  return Object.entries(details)
    .map(([key, value]): DetailRow | null => {
      const label = DETAIL_FIELD_LABELS[key] ?? humanizeKey(key)

      if (typeof value === "boolean") {
        return {
          active: value,
          kind: "boolean",
          label,
        }
      }

      const rowValue = detailValue(key, value)

      return rowValue
        ? {
            kind: "value",
            label,
            value: rowValue,
          }
        : null
    })
    .filter((row): row is DetailRow => Boolean(row))
}

export function publicImmovableAmenityLabels(property: PublicImmovable) {
  const details = publicImmovableSpecificDetails(property)

  if (!isRecord(details)) {
    return []
  }

  return Object.entries(details)
    .filter(([, value]) => value === true)
    .map(([key]) => DETAIL_FIELD_LABELS[key] ?? humanizeKey(key))
    .slice(0, 8)
}

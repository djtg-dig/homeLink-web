type Immeuble = {
  ascenseur?: boolean | null
  created_at?: string | null
  id?: number | string
  jardin?: boolean | null
  nom?: string | null
  nombre_etages?: number | string | null
  piscine?: boolean | null
  type_immeuble?: string | null
  updated_at?: string | null
}

type ImmeublesResponse =
  | Immeuble[]
  | {
      count?: number
      data?: Immeuble[]
      results?: Immeuble[]
    }

const immeubleTypeLabels: Record<string, string> = {
  COM: "Commercial",
  MIX: "Mixte",
  RES: "Résidentiel",
}

function parseImmeubles(response: ImmeublesResponse) {
  if (Array.isArray(response)) {
    return {
      count: response.length,
      immeubles: response,
    }
  }

  const immeubles = response.results ?? response.data ?? []

  return {
    count: response.count ?? immeubles.length,
    immeubles,
  }
}

function immeubleDisplayName(immeuble: Immeuble) {
  return immeuble.nom?.trim() || "Immeuble sans nom"
}

function immeubleTypeLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  return immeubleTypeLabels[value] ?? value
}

function immeubleId(immeuble: Immeuble) {
  return immeuble.id === undefined || immeuble.id === null
    ? ""
    : String(immeuble.id)
}

function booleanLabel(value?: boolean | null) {
  return value ? "Oui" : "Non"
}

export {
  booleanLabel,
  immeubleDisplayName,
  immeubleId,
  immeubleTypeLabel,
  parseImmeubles,
  type Immeuble,
  type ImmeublesResponse,
}

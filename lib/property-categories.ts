export const propertyCategories = [
  {
    description: "Gérer les agences et leurs portefeuilles.",
    label: "Agences",
    slug: "agences",
  },
  {
    description: "Suivre les appartements disponibles ou en validation.",
    label: "Appartements",
    slug: "appartements",
  },
  {
    description: "Organiser les espaces professionnels et commerciaux.",
    label: "Bureaux",
    slug: "bureaux",
  },
  {
    description: "Piloter les biens hôteliers et leurs informations clés.",
    label: "Hôtels",
    slug: "hotels",
  },
  {
    description: "Centraliser les immeubles et leurs lots associés.",
    label: "Immeubles",
    slug: "immeubles",
  },
  {
    description: "Lister les kiosques et petites surfaces.",
    label: "Kiosques",
    slug: "kiosques",
  },
  {
    description: "Gérer les maisons et leurs détails de publication.",
    label: "Maisons",
    slug: "maisons",
  },
  {
    description: "Référencer les terrains et leurs caractéristiques.",
    label: "Terrains",
    slug: "terrains",
  },
  {
    description: "Gérer les salles destinées aux événements.",
    label: "Salles événement",
    slug: "salles-evenement",
  },
] as const

export type PropertyCategory = (typeof propertyCategories)[number]

export const propertyCategories = [
  {
    description: "Gerer les agences et leurs portefeuilles.",
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
    description: "Piloter les biens hoteliers et leurs informations cles.",
    label: "Hotels",
    slug: "hotels",
  },
  {
    description: "Centraliser les immeubles et leurs lots associes.",
    label: "Immeubles",
    slug: "immeubles",
  },
  {
    description: "Lister les kiosques et petites surfaces.",
    label: "Kiosques",
    slug: "kiosques",
  },
  {
    description: "Gerer les maisons et leurs details de publication.",
    label: "Maisons",
    slug: "maisons",
  },
  {
    description: "Referencer les terrains et leurs caracteristiques.",
    label: "Terrains",
    slug: "terrains",
  },
] as const

export type PropertyCategory = (typeof propertyCategories)[number]

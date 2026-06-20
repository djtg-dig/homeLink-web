"use client"

import * as React from "react"

import { apiUrl } from "@/lib/api-client"

type AddressFieldName =
  | "administrative_area"
  | "city"
  | "complement_adresse"
  | "country"
  | "country_id"
  | "formatted_address"
  | "latitude"
  | "locality"
  | "longitude"
  | "neighborhood"
  | "postal_code"
  | "proximite_transports"
  | "state"
  | "street"
  | "sub_locality"

type AddressFieldMetadata = {
  description: string
  maxLength?: number
  nullable?: boolean
  readOnly?: boolean
  title: string
  type?: string
}

type AddressFieldMetadataMap = Record<AddressFieldName, AddressFieldMetadata>

type AddressSchemaName = "AddressRequest" | "LocalisationAddressRequest"

const fallbackAddressFields: AddressFieldMetadataMap = {
  administrative_area: {
    description:
      "Sélectionnez la province, la région ou la division administrative si elle existe dans la base.",
    nullable: true,
    title: "Province / État / Région",
    type: "integer",
  },
  city: {
    description:
      "À utiliser seulement si la ville/commune n'existe pas encore dans la base.",
    maxLength: 150,
    title: "Ville / Commune libre",
    type: "string",
  },
  complement_adresse: {
    description: "Appartement, étage, bâtiment, référence ou autre précision.",
    maxLength: 255,
    title: "Complément d'adresse",
    type: "string",
  },
  country: {
    description: "Sélectionnez le pays auquel appartient cette adresse.",
    title: "Pays",
    type: "integer",
  },
  country_id: {
    description: "Sélectionnez le pays auquel appartient cette adresse.",
    title: "Pays",
    type: "integer",
  },
  formatted_address: {
    description: "Adresse complète prête à afficher.",
    maxLength: 500,
    title: "Adresse formatée",
    type: "string",
  },
  latitude: {
    description:
      "Coordonnée GPS latitude optionnelle, comprise entre -90 et 90.",
    nullable: true,
    title: "Latitude",
    type: "string",
  },
  locality: {
    description:
      "Sélectionnez la ville, la commune ou la localité principale si elle existe dans la base.",
    nullable: true,
    title: "Ville / Commune",
    type: "integer",
  },
  longitude: {
    description:
      "Coordonnée GPS longitude optionnelle, comprise entre -180 et 180.",
    nullable: true,
    title: "Longitude",
    type: "string",
  },
  neighborhood: {
    description:
      "À utiliser seulement si le quartier n'existe pas encore dans la base.",
    maxLength: 150,
    title: "Quartier / Localité libre",
    type: "string",
  },
  postal_code: {
    description: "Code postal ou ZIP code selon le pays.",
    maxLength: 20,
    nullable: true,
    title: "Code postal",
    type: "string",
  },
  proximite_transports: {
    description: "Métro, bus, arrêt, gare ou point de repère proche.",
    title: "Proximité transports",
    type: "string",
  },
  state: {
    description:
      "À utiliser seulement si la province/région n'existe pas encore dans la base.",
    maxLength: 150,
    title: "Province / État / Région libre",
    type: "string",
  },
  street: {
    description: "Rue, avenue, numéro, immeuble ou autre précision d'adresse.",
    maxLength: 200,
    title: "Rue / Avenue",
    type: "string",
  },
  sub_locality: {
    description:
      "Sélectionnez le quartier, l'arrondissement ou la subdivision locale si elle existe dans la base.",
    nullable: true,
    title: "Quartier / Arrondissement",
    type: "integer",
  },
}

const addressFieldNames = Object.keys(
  fallbackAddressFields
) as AddressFieldName[]

const technicalRelationFields = new Set<AddressFieldName>([
  "administrative_area",
  "country",
  "country_id",
  "locality",
  "sub_locality",
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function schemaProperties(schema: unknown, schemaName: AddressSchemaName) {
  if (!isRecord(schema)) {
    return {}
  }

  const components = isRecord(schema.components) ? schema.components : {}
  const schemas = isRecord(components.schemas) ? components.schemas : {}
  const addressSchema = isRecord(schemas.Address) ? schemas.Address : {}
  const requestSchema = isRecord(schemas[schemaName]) ? schemas[schemaName] : {}
  const addressProperties = isRecord(addressSchema.properties)
    ? addressSchema.properties
    : {}
  const requestProperties = isRecord(requestSchema.properties)
    ? requestSchema.properties
    : {}

  return {
    ...addressProperties,
    ...requestProperties,
  }
}

function metadataValue(
  value: unknown,
  fallback: AddressFieldMetadata
): AddressFieldMetadata {
  if (!isRecord(value)) {
    return fallback
  }

  return {
    description:
      typeof value.description === "string" && value.description.trim()
        ? value.description.trim()
        : fallback.description,
    maxLength:
      typeof value.maxLength === "number"
        ? value.maxLength
        : fallback.maxLength,
    nullable:
      typeof value.nullable === "boolean" ? value.nullable : fallback.nullable,
    readOnly:
      typeof value.readOnly === "boolean" ? value.readOnly : fallback.readOnly,
    title:
      typeof value.title === "string" && value.title.trim()
        ? value.title.trim()
        : fallback.title,
    type: typeof value.type === "string" ? value.type : fallback.type,
  }
}

function parseAddressFields(
  schema: unknown,
  schemaName: AddressSchemaName
): AddressFieldMetadataMap {
  const properties = schemaProperties(schema, schemaName)

  return Object.fromEntries(
    addressFieldNames.map((name) => {
      const metadata = metadataValue(
        properties[name],
        fallbackAddressFields[name]
      )

      return [
        name,
        technicalRelationFields.has(name)
          ? {
              ...metadata,
              description: fallbackAddressFields[name].description,
              title: fallbackAddressFields[name].title,
            }
          : metadata,
      ]
    })
  ) as AddressFieldMetadataMap
}

function useAddressFieldMetadata(schemaName: AddressSchemaName) {
  const [fields, setFields] = React.useState<AddressFieldMetadataMap>(
    fallbackAddressFields
  )

  React.useEffect(() => {
    const controller = new AbortController()

    fetch(apiUrl("/api/schema/?format=json"), {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Schéma OpenAPI indisponible.")
        }

        return response.json() as Promise<unknown>
      })
      .then((schema) => {
        if (!controller.signal.aborted) {
          setFields(parseAddressFields(schema, schemaName))
        }
      })
      .catch(() => {
        // Les métadonnées locales gardent le formulaire utilisable hors ligne.
      })

    return () => controller.abort()
  }, [schemaName])

  return fields
}

export {
  fallbackAddressFields,
  useAddressFieldMetadata,
  type AddressFieldMetadata,
  type AddressFieldMetadataMap,
  type AddressFieldName,
}

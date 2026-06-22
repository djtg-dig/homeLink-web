"use client"

import * as React from "react"
import { Loader2, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toaster"
import {
  agencyDisplayName,
  parseAgencies,
  type AgenciesResponse,
  type Agency,
} from "@/lib/agencies"
import { ApiError, apiFetch, jsonHeaders } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import {
  appartementDisplayName,
  appartementId,
  type Appartement,
} from "@/lib/appartements"
import {
  immeubleDisplayName,
  immeubleId,
  immeubleTypeLabel,
  parseImmeubles,
  type Immeuble,
  type ImmeublesResponse,
} from "@/lib/immeubles"

const NO_AGENCY_VALUE = "__none__"
const NO_IMMEUBLE_VALUE = "__none__"

type AppartementEditValues = {
  agency_id: string
  balcon: boolean
  cave: boolean
  cheminee: boolean
  classe_energie: string
  climatisation: boolean
  description: string
  emission_ges: string
  est_proprietaire: boolean
  etage: string
  immeuble: string
  interphone: boolean
  is_active: boolean
  jardin: boolean
  meuble: boolean
  nombre_chambres: string
  nombre_pieces: string
  nombre_sdb: string
  parking: boolean
  piscine: boolean
  prix_location_mensuel: string
  prix_vente: string
  statut: string
  superficie: string
  superficie_terrasse: string
  surface_habitable: string
  surface_totale: string
  terrasse: boolean
  title: string
  type_transaction: string
}

const statutOptions = [
  { label: "Disponible", value: "disponible" },
  { label: "Réservé", value: "reserve" },
  { label: "Indisponible", value: "indisponible" },
  { label: "Vendu", value: "vendu" },
  { label: "Loué", value: "loue" },
]

const transactionOptions = [
  { label: "Vente", value: "vente" },
  { label: "Location", value: "location" },
]

const performanceOptions = ["A", "B", "C", "D", "E", "F", "G"].map((value) => ({
  label: value,
  value,
}))

const comfortFields: Array<{
  label: string
  name: keyof AppartementEditValues
}> = [
  { label: "Meublé", name: "meuble" },
  { label: "Parking", name: "parking" },
  { label: "Cave", name: "cave" },
  { label: "Balcon", name: "balcon" },
  { label: "Terrasse", name: "terrasse" },
  { label: "Jardin", name: "jardin" },
  { label: "Piscine", name: "piscine" },
  { label: "Climatisation", name: "climatisation" },
  { label: "Cheminée", name: "cheminee" },
  { label: "Interphone", name: "interphone" },
]

const inputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
const textAreaClassName =
  "min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
const labelClassName = "text-sm font-medium text-foreground"

function valueText(value: unknown) {
  return value === undefined || value === null ? "" : String(value)
}

function requiredText(value: string, label: string) {
  const nextValue = value.trim()

  if (!nextValue) {
    throw new Error(`${label} est obligatoire.`)
  }

  return nextValue
}

function optionalText(value: string) {
  const nextValue = value.trim()

  return nextValue || undefined
}

function requiredInteger(value: string, label: string) {
  const nextValue = requiredText(value, label)

  if (!/^-?\d+$/.test(nextValue)) {
    throw new Error(`${label} doit être un nombre entier.`)
  }

  return Number(nextValue)
}

function optionalInteger(value: string, label: string) {
  const nextValue = value.trim()

  if (!nextValue || nextValue === NO_IMMEUBLE_VALUE) {
    return undefined
  }

  if (!/^-?\d+$/.test(nextValue)) {
    throw new Error(`${label} doit être un nombre entier.`)
  }

  return Number(nextValue)
}

function formValuesFromAppartement(
  appartement: Appartement
): AppartementEditValues {
  const details = appartement.appartement

  return {
    agency_id: appartement.agency?.id
      ? String(appartement.agency.id)
      : NO_AGENCY_VALUE,
    balcon: Boolean(details?.balcon),
    cave: Boolean(details?.cave),
    cheminee: Boolean(details?.cheminee),
    classe_energie: details?.classe_energie?.trim() || "A",
    climatisation: Boolean(details?.climatisation),
    description: appartement.description?.trim() ?? "",
    emission_ges: details?.emission_ges?.trim() || "A",
    est_proprietaire: appartement.est_proprietaire !== false,
    etage: valueText(details?.etage),
    immeuble:
      details?.immeuble === undefined || details?.immeuble === null
        ? NO_IMMEUBLE_VALUE
        : valueText(details.immeuble),
    interphone: Boolean(details?.interphone),
    is_active: appartement.is_active !== false,
    jardin: Boolean(details?.jardin),
    meuble: Boolean(details?.meuble),
    nombre_chambres: valueText(details?.nombre_chambres),
    nombre_pieces: valueText(details?.nombre_pieces),
    nombre_sdb: valueText(details?.nombre_sdb),
    parking: Boolean(details?.parking),
    piscine: Boolean(details?.piscine),
    prix_location_mensuel: valueText(appartement.prix_location_mensuel),
    prix_vente: valueText(appartement.prix_vente),
    statut: appartement.statut?.trim() || "disponible",
    superficie: valueText(details?.superficie),
    superficie_terrasse: valueText(details?.superficie_terrasse),
    surface_habitable: valueText(appartement.surface_habitable),
    surface_totale: valueText(appartement.surface_totale),
    terrasse: Boolean(details?.terrasse),
    title: appartement.title?.trim() ?? "",
    type_transaction: appartement.type_transaction?.trim() || "vente",
  }
}

function buildPatchPayload(values: AppartementEditValues) {
  const price =
    values.type_transaction === "vente"
      ? requiredText(values.prix_vente, "Le prix de vente")
      : requiredText(
          values.prix_location_mensuel,
          "Le prix de location mensuel"
        )
  const appartement: Record<string, unknown> = {
    balcon: values.balcon,
    cave: values.cave,
    cheminee: values.cheminee,
    classe_energie: values.classe_energie,
    climatisation: values.climatisation,
    emission_ges: values.emission_ges,
    etage: requiredInteger(values.etage, "L'étage"),
    interphone: values.interphone,
    jardin: values.jardin,
    meuble: values.meuble,
    nombre_chambres: requiredInteger(
      values.nombre_chambres,
      "Le nombre de chambres"
    ),
    nombre_pieces: requiredInteger(values.nombre_pieces, "Le nombre de pièces"),
    nombre_sdb: requiredInteger(
      values.nombre_sdb,
      "Le nombre de salles de bain"
    ),
    parking: values.parking,
    piscine: values.piscine,
    superficie: requiredText(values.superficie, "La superficie"),
    terrasse: values.terrasse,
  }
  const immeuble = optionalInteger(values.immeuble, "L'immeuble")
  const superficieTerrasse = optionalText(values.superficie_terrasse)

  appartement.immeuble = immeuble ?? null

  if (superficieTerrasse !== undefined) {
    appartement.superficie_terrasse = superficieTerrasse
  }

  return {
    ...(values.agency_id === NO_AGENCY_VALUE
      ? {}
      : { agency_id: values.agency_id }),
    appartement,
    description: values.description.trim(),
    est_proprietaire: values.est_proprietaire,
    is_active: values.is_active,
    prix_location_mensuel:
      values.type_transaction === "location"
        ? price
        : optionalText(values.prix_location_mensuel),
    prix_vente:
      values.type_transaction === "vente"
        ? price
        : optionalText(values.prix_vente),
    statut: values.statut,
    surface_habitable: requiredText(
      values.surface_habitable,
      "La surface habitable"
    ),
    surface_totale: requiredText(values.surface_totale, "La surface totale"),
    title: requiredText(values.title, "Le titre"),
    type_transaction: values.type_transaction,
  }
}

function TextField({
  inputMode,
  label,
  name,
  onChange,
  required,
  value,
}: {
  inputMode?: "decimal" | "numeric" | "text"
  label: string
  name: keyof AppartementEditValues
  onChange: (name: keyof AppartementEditValues, value: string) => void
  required?: boolean
  value: string
}) {
  return (
    <div className="space-y-2">
      <label className={labelClassName} htmlFor={`edit-${name}`}>
        {label}
      </label>
      <input
        className={inputClassName}
        id={`edit-${name}`}
        name={name}
        type="text"
        value={value}
        inputMode={inputMode}
        required={required}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </div>
  )
}

function SelectField({
  label,
  name,
  onChange,
  options,
  value,
}: {
  label: string
  name: keyof AppartementEditValues
  onChange: (name: keyof AppartementEditValues, value: string) => void
  options: Array<{ label: string; value: string }>
  value: string
}) {
  return (
    <div className="space-y-2">
      <label className={labelClassName} htmlFor={`edit-${name}`}>
        {label}
      </label>
      <Select
        value={value}
        onValueChange={(nextValue) => onChange(name, nextValue)}
      >
        <SelectTrigger id={`edit-${name}`} className="h-10 w-full rounded-md">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function SwitchField({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-primary"
      />
    </label>
  )
}

function AppartementEditDialog({
  appartement,
  onClose,
  onUpdated,
}: {
  appartement: Appartement
  onClose: () => void
  onUpdated: (appartement: Appartement) => void
}) {
  const [values, setValues] = React.useState<AppartementEditValues>(() =>
    formValuesFromAppartement(appartement)
  )
  const [agencies, setAgencies] = React.useState<Agency[]>([])
  const [agenciesError, setAgenciesError] = React.useState("")
  const [immeubles, setImmeubles] = React.useState<Immeuble[]>([])
  const [immeublesError, setImmeublesError] = React.useState("")
  const [loadingAgencies, setLoadingAgencies] = React.useState(true)
  const [loadingImmeubles, setLoadingImmeubles] = React.useState(true)
  const [error, setError] = React.useState("")
  const [pending, setPending] = React.useState(false)

  const loadAgencies = React.useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await apiFetch<AgenciesResponse>("/api/agencies/", {
        signal,
      })
      const parsed = parseAgencies(response)

      if (signal?.aborted) {
        return
      }

      setAgencies(parsed.agencies)
      setAgenciesError("")
    } catch (caughtError) {
      if (signal?.aborted) {
        return
      }

      if (caughtError instanceof ApiError) {
        setAgenciesError(
          formatApiMessage(
            caughtError.body,
            "Chargement des agences impossible."
          )
        )
      } else {
        setAgenciesError(
          caughtError instanceof Error
            ? caughtError.message
            : "Chargement des agences impossible."
        )
      }
    } finally {
      if (!signal?.aborted) {
        setLoadingAgencies(false)
      }
    }
  }, [])

  const loadImmeubles = React.useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await apiFetch<ImmeublesResponse>(
        "/api/immovables/immeubles/",
        { signal }
      )
      const parsed = parseImmeubles(response)

      if (signal?.aborted) {
        return
      }

      setImmeubles(parsed.immeubles)
      setImmeublesError("")
    } catch (caughtError) {
      if (signal?.aborted) {
        return
      }

      if (caughtError instanceof ApiError) {
        setImmeublesError(
          formatApiMessage(
            caughtError.body,
            "Chargement des immeubles impossible."
          )
        )
      } else {
        setImmeublesError(
          caughtError instanceof Error
            ? caughtError.message
            : "Chargement des immeubles impossible."
        )
      }
    } finally {
      if (!signal?.aborted) {
        setLoadingImmeubles(false)
      }
    }
  }, [])

  React.useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadAgencies(controller.signal)
      void loadImmeubles(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadAgencies, loadImmeubles])

  function updateValue(name: keyof AppartementEditValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function updateBoolean(name: keyof AppartementEditValues, checked: boolean) {
    setValues((current) => ({ ...current, [name]: checked }))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const id = appartementId(appartement)

    if (!id) {
      setError("Cet appartement ne contient pas d'identifiant.")
      return
    }

    setPending(true)

    try {
      const payload = buildPatchPayload(values)
      const updatedAppartement = await apiFetch<
        Partial<Appartement> | undefined
      >(`/api/immovables/appartements/${encodeURIComponent(id)}/`, {
        body: JSON.stringify(payload),
        headers: jsonHeaders(),
        method: "PATCH",
      })

      onUpdated({
        ...appartement,
        ...payload,
        ...(updatedAppartement ?? {}),
      })
      toast({
        description: "Les informations de l'appartement ont été mises à jour.",
        title: "Appartement modifié",
        variant: "success",
      })
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(formatApiMessage(caughtError.body, "Modification impossible."))
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Modification impossible."
        )
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-brand-navy/55 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-appartement-title"
    >
      <form
        className="max-h-[92svh] w-full overflow-y-auto rounded-t-lg border border-border bg-card text-card-foreground shadow-xl sm:max-w-5xl sm:rounded-lg"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              Modification d&apos;appartement
            </p>
            <h2
              id="edit-appartement-title"
              className="mt-1 truncate text-xl font-semibold"
            >
              {appartementDisplayName(appartement)}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={pending}
          >
            <X />
          </Button>
        </div>

        <div className="space-y-5 p-4">
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <section className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">Publication</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Informations générales du bien.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Titre *"
                name="title"
                value={values.title}
                required
                onChange={updateValue}
              />
              <div className="space-y-2">
                <label className={labelClassName} htmlFor="edit-agency_id">
                  Agence
                </label>
                {loadingAgencies ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={values.agency_id}
                    onValueChange={(nextValue) =>
                      updateValue("agency_id", nextValue)
                    }
                  >
                    <SelectTrigger id="edit-agency_id" className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_AGENCY_VALUE}>
                        Sans agence
                      </SelectItem>
                      {agencies
                        .filter((agency) => agency.id)
                        .map((agency) => (
                          <SelectItem
                            key={String(agency.id)}
                            value={String(agency.id)}
                          >
                            {agencyDisplayName(agency)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
                {agenciesError ? (
                  <p className="text-xs text-destructive">{agenciesError}</p>
                ) : null}
              </div>
              <SelectField
                label="Statut"
                name="statut"
                value={values.statut}
                options={statutOptions}
                onChange={updateValue}
              />
              <SelectField
                label="Transaction"
                name="type_transaction"
                value={values.type_transaction}
                options={transactionOptions}
                onChange={updateValue}
              />
              <TextField
                label="Surface totale *"
                name="surface_totale"
                value={values.surface_totale}
                inputMode="decimal"
                required
                onChange={updateValue}
              />
              <TextField
                label="Surface habitable *"
                name="surface_habitable"
                value={values.surface_habitable}
                inputMode="decimal"
                required
                onChange={updateValue}
              />
              <TextField
                label="Prix de vente"
                name="prix_vente"
                value={values.prix_vente}
                inputMode="decimal"
                onChange={updateValue}
              />
              <TextField
                label="Loyer mensuel"
                name="prix_location_mensuel"
                value={values.prix_location_mensuel}
                inputMode="decimal"
                onChange={updateValue}
              />
              <div className="space-y-2 md:col-span-2">
                <label className={labelClassName} htmlFor="edit-description">
                  Description
                </label>
                <textarea
                  className={textAreaClassName}
                  id="edit-description"
                  name="description"
                  value={values.description}
                  onChange={(event) =>
                    updateValue("description", event.target.value)
                  }
                />
              </div>
              <SwitchField
                label="Bien actif"
                checked={values.is_active}
                onChange={(checked) => updateBoolean("is_active", checked)}
              />
              <SwitchField
                label="Propriétaire"
                checked={values.est_proprietaire}
                onChange={(checked) =>
                  updateBoolean("est_proprietaire", checked)
                }
              />
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">Appartement</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Caractéristiques et rattachement à un immeuble.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-3">
                <label className={labelClassName} htmlFor="edit-immeuble">
                  Immeuble
                </label>
                {loadingImmeubles ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={values.immeuble}
                    onValueChange={(nextValue) =>
                      updateValue("immeuble", nextValue)
                    }
                  >
                    <SelectTrigger id="edit-immeuble" className="h-10 w-full">
                      <SelectValue placeholder="Sélectionner un immeuble" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_IMMEUBLE_VALUE}>
                        Sans immeuble
                      </SelectItem>
                      {immeubles
                        .filter((immeuble) => immeubleId(immeuble))
                        .map((immeuble) => (
                          <SelectItem
                            key={immeubleId(immeuble)}
                            value={immeubleId(immeuble)}
                          >
                            {immeubleDisplayName(immeuble)} -{" "}
                            {immeubleTypeLabel(immeuble.type_immeuble)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
                {immeublesError ? (
                  <p className="text-xs text-destructive">{immeublesError}</p>
                ) : null}
                {!loadingImmeubles &&
                !immeublesError &&
                immeubles.length === 0 ? (
                  <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                    Aucun immeuble disponible pour le moment.
                  </div>
                ) : null}
              </div>
              <TextField
                label="Étage *"
                name="etage"
                value={values.etage}
                inputMode="numeric"
                required
                onChange={updateValue}
              />
              <TextField
                label="Superficie *"
                name="superficie"
                value={values.superficie}
                inputMode="decimal"
                required
                onChange={updateValue}
              />
              <TextField
                label="Superficie terrasse"
                name="superficie_terrasse"
                value={values.superficie_terrasse}
                inputMode="decimal"
                onChange={updateValue}
              />
              <TextField
                label="Nombre de pièces *"
                name="nombre_pieces"
                value={values.nombre_pieces}
                inputMode="numeric"
                required
                onChange={updateValue}
              />
              <TextField
                label="Nombre de chambres *"
                name="nombre_chambres"
                value={values.nombre_chambres}
                inputMode="numeric"
                required
                onChange={updateValue}
              />
              <TextField
                label="Salles de bain *"
                name="nombre_sdb"
                value={values.nombre_sdb}
                inputMode="numeric"
                required
                onChange={updateValue}
              />
              <SelectField
                label="Classe énergie"
                name="classe_energie"
                value={values.classe_energie}
                options={performanceOptions}
                onChange={updateValue}
              />
              <SelectField
                label="Émission GES"
                name="emission_ges"
                value={values.emission_ges}
                options={performanceOptions}
                onChange={updateValue}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">Confort</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Équipements disponibles dans l&apos;appartement.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {comfortFields.map((field) => (
                <SwitchField
                  key={field.name}
                  label={field.label}
                  checked={Boolean(values[field.name])}
                  onChange={(checked) => updateBoolean(field.name, checked)}
                />
              ))}
            </div>
          </section>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              Enregistrer
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export { AppartementEditDialog }

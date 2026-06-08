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
import { toast } from "@/components/ui/toaster"
import { ApiError, apiFetch, jsonHeaders } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import { kiosqueDisplayName, kiosqueId, type Kiosque } from "@/lib/kiosques"

type KiosqueEditValues = {
  description: string
  description_equipements: string
  est_proprietaire: boolean
  has_electricity: boolean
  has_security_grid: boolean
  has_storage: boolean
  has_water: boolean
  is_active: boolean
  is_furnished: boolean
  is_movable: boolean
  kiosque_type: string
  opening_side_count: string
  prix_location_mensuel: string
  prix_vente: string
  statut: string
  surface: string
  surface_totale: string
  title: string
  type_transaction: string
}

const statutOptions = [
  { label: "Disponible", value: "disponible" },
  { label: "Réservé", value: "reserve" },
  { label: "Indisponible", value: "indisponible" },
  { label: "Loué", value: "loue" },
  { label: "Vendu", value: "vendu" },
]

const transactionOptions = [
  { label: "Location", value: "location" },
  { label: "Vente", value: "vente" },
]

const kiosqueTypeOptions = [
  { label: "Alimentaire", value: "alimentaire" },
  { label: "Presse", value: "presse" },
  { label: "Service", value: "service" },
  { label: "Mobile money", value: "mobile_money" },
  { label: "Boutique", value: "boutique" },
  { label: "Autre", value: "autre" },
]

const equipmentFields: Array<{
  label: string
  name: keyof KiosqueEditValues
}> = [
  { label: "Électricité", name: "has_electricity" },
  { label: "Eau", name: "has_water" },
  { label: "Rangement", name: "has_storage" },
  { label: "Grille de sécurité", name: "has_security_grid" },
  { label: "Déplaçable", name: "is_movable" },
  { label: "Meublé", name: "is_furnished" },
]

const inputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
const textAreaClassName =
  "min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
const labelClassName = "text-sm font-medium text-foreground"

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

  if (!/^\d+$/.test(nextValue)) {
    throw new Error(`${label} doit être un nombre entier.`)
  }

  return Number(nextValue)
}

function valueText(value: unknown) {
  return value === undefined || value === null ? "" : String(value)
}

function formValuesFromKiosque(kiosque: Kiosque): KiosqueEditValues {
  const details = kiosque.kiosque

  return {
    description: kiosque.description?.trim() ?? "",
    description_equipements: details?.description_equipements?.trim() ?? "",
    est_proprietaire: kiosque.est_proprietaire !== false,
    has_electricity: Boolean(details?.has_electricity),
    has_security_grid: Boolean(details?.has_security_grid),
    has_storage: Boolean(details?.has_storage),
    has_water: Boolean(details?.has_water),
    is_active: kiosque.is_active !== false,
    is_furnished: Boolean(details?.is_furnished),
    is_movable: Boolean(details?.is_movable),
    kiosque_type: details?.kiosque_type?.trim() || "mobile_money",
    opening_side_count: valueText(details?.opening_side_count),
    prix_location_mensuel: valueText(kiosque.prix_location_mensuel),
    prix_vente: valueText(kiosque.prix_vente),
    statut: kiosque.statut?.trim() || "disponible",
    surface: valueText(details?.surface),
    surface_totale: valueText(kiosque.surface_totale),
    title: kiosque.title?.trim() ?? "",
    type_transaction: kiosque.type_transaction?.trim() || "location",
  }
}

function buildPatchPayload(values: KiosqueEditValues) {
  const price =
    values.type_transaction === "vente"
      ? requiredText(values.prix_vente, "Le prix de vente")
      : requiredText(
          values.prix_location_mensuel,
          "Le prix de location mensuel"
        )

  return {
    description: values.description.trim(),
    est_proprietaire: values.est_proprietaire,
    is_active: values.is_active,
    kiosque: {
      description_equipements: values.description_equipements.trim(),
      has_electricity: values.has_electricity,
      has_security_grid: values.has_security_grid,
      has_storage: values.has_storage,
      has_water: values.has_water,
      is_furnished: values.is_furnished,
      is_movable: values.is_movable,
      kiosque_type: values.kiosque_type,
      opening_side_count: requiredInteger(
        values.opening_side_count,
        "Le nombre d'ouvertures"
      ),
      surface: requiredText(values.surface, "La surface du kiosque"),
    },
    prix_location_mensuel:
      values.type_transaction === "location"
        ? price
        : optionalText(values.prix_location_mensuel),
    prix_vente:
      values.type_transaction === "vente"
        ? price
        : optionalText(values.prix_vente),
    statut: values.statut,
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
  name: keyof KiosqueEditValues
  onChange: (name: keyof KiosqueEditValues, value: string) => void
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
  name: keyof KiosqueEditValues
  onChange: (name: keyof KiosqueEditValues, value: string) => void
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

function KiosqueEditDialog({
  kiosque,
  onClose,
  onUpdated,
}: {
  kiosque: Kiosque
  onClose: () => void
  onUpdated: (kiosque: Kiosque) => void
}) {
  const [values, setValues] = React.useState<KiosqueEditValues>(() =>
    formValuesFromKiosque(kiosque)
  )
  const [error, setError] = React.useState("")
  const [pending, setPending] = React.useState(false)

  function updateValue(name: keyof KiosqueEditValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function updateBoolean(name: keyof KiosqueEditValues, checked: boolean) {
    setValues((current) => ({ ...current, [name]: checked }))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const id = kiosqueId(kiosque)

    if (!id) {
      setError("Ce kiosque ne contient pas d'identifiant.")
      return
    }

    setPending(true)

    try {
      const payload = buildPatchPayload(values)
      const updatedKiosque = await apiFetch<Partial<Kiosque> | undefined>(
        `/api/immovables/kiosques/${encodeURIComponent(id)}/`,
        {
          body: JSON.stringify(payload),
          headers: jsonHeaders(),
          method: "PATCH",
        }
      )

      onUpdated({
        ...kiosque,
        ...payload,
        ...(updatedKiosque ?? {}),
      })
      toast({
        description: "Les informations du kiosque ont été mises à jour.",
        title: "Kiosque modifié",
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
      aria-labelledby="edit-kiosque-title"
    >
      <form
        className="max-h-[92svh] w-full overflow-y-auto rounded-t-lg border border-border bg-card text-card-foreground shadow-xl sm:max-w-5xl sm:rounded-lg"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              Modification de kiosque
            </p>
            <h2
              id="edit-kiosque-title"
              className="mt-1 truncate text-xl font-semibold"
            >
              {kiosqueDisplayName(kiosque)}
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
                Informations générales du kiosque.
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
                label="Loyer mensuel"
                name="prix_location_mensuel"
                value={values.prix_location_mensuel}
                inputMode="decimal"
                onChange={updateValue}
              />
              <TextField
                label="Prix de vente"
                name="prix_vente"
                value={values.prix_vente}
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
              <h3 className="text-base font-semibold">Kiosque</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Type, surface, ouvertures et équipements.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <SelectField
                label="Type de kiosque"
                name="kiosque_type"
                value={values.kiosque_type}
                options={kiosqueTypeOptions}
                onChange={updateValue}
              />
              <TextField
                label="Surface du kiosque *"
                name="surface"
                value={values.surface}
                inputMode="decimal"
                required
                onChange={updateValue}
              />
              <TextField
                label="Nombre d'ouvertures *"
                name="opening_side_count"
                value={values.opening_side_count}
                inputMode="numeric"
                required
                onChange={updateValue}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">Équipements</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Services, sécurité et aménagement du kiosque.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {equipmentFields.map((field) => (
                <SwitchField
                  key={field.name}
                  label={field.label}
                  checked={Boolean(values[field.name])}
                  onChange={(checked) => updateBoolean(field.name, checked)}
                />
              ))}
            </div>
            <div className="space-y-2">
              <label
                className={labelClassName}
                htmlFor="edit-description_equipements"
              >
                Description des équipements
              </label>
              <textarea
                className={textAreaClassName}
                id="edit-description_equipements"
                name="description_equipements"
                value={values.description_equipements}
                onChange={(event) =>
                  updateValue("description_equipements", event.target.value)
                }
              />
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

export { KiosqueEditDialog }

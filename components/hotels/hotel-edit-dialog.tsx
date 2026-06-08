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
import { hotelDisplayName, hotelId, type Hotel } from "@/lib/hotels"

type HotelEditValues = {
  description: string
  description_equipements: string
  est_proprietaire: boolean
  has_bar: boolean
  has_conference_room: boolean
  has_garden: boolean
  has_generator: boolean
  has_laundry: boolean
  has_parking: boolean
  has_pool: boolean
  has_reception: boolean
  has_restaurant: boolean
  has_security_service: boolean
  has_wifi: boolean
  hotel_type: string
  is_active: boolean
  is_furnished: boolean
  is_operational: boolean
  nombre_chambres: string
  nombre_etages: string
  nombre_lits_total: string
  nombre_salles_bain: string
  prix_vente: string
  standing: string
  star_rating: string
  statut: string
  surface_totale: string
  title: string
  type_transaction: string
}

const statutOptions = [
  { label: "Disponible", value: "disponible" },
  { label: "Réservé", value: "reserve" },
  { label: "Indisponible", value: "indisponible" },
  { label: "Vendu", value: "vendu" },
]

const transactionOptions = [{ label: "Vente", value: "vente" }]

const hotelTypeOptions = [{ label: "Hôtel simple", value: "hotel_simple" }]

const standingOptions = [{ label: "Standard", value: "standard" }]

const equipmentFields: Array<{ label: string; name: keyof HotelEditValues }> = [
  { label: "Réception", name: "has_reception" },
  { label: "Restaurant", name: "has_restaurant" },
  { label: "Bar", name: "has_bar" },
  { label: "Salle de conférence", name: "has_conference_room" },
  { label: "Piscine", name: "has_pool" },
  { label: "Parking", name: "has_parking" },
  { label: "Jardin", name: "has_garden" },
  { label: "Générateur", name: "has_generator" },
  { label: "Wi-Fi", name: "has_wifi" },
  { label: "Blanchisserie", name: "has_laundry" },
  { label: "Service de sécurité", name: "has_security_service" },
  { label: "Meublé", name: "is_furnished" },
  { label: "Opérationnel", name: "is_operational" },
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

function requiredInteger(value: string, label: string) {
  const nextValue = requiredText(value, label)

  if (!/^\d+$/.test(nextValue)) {
    throw new Error(`${label} doit être un nombre entier.`)
  }

  return Number(nextValue)
}

function formValuesFromHotel(hotel: Hotel): HotelEditValues {
  const details = hotel.hotel

  return {
    description: hotel.description?.trim() ?? "",
    description_equipements: details?.description_equipements?.trim() ?? "",
    est_proprietaire: hotel.est_proprietaire !== false,
    has_bar: Boolean(details?.has_bar),
    has_conference_room: Boolean(details?.has_conference_room),
    has_garden: Boolean(details?.has_garden),
    has_generator: Boolean(details?.has_generator),
    has_laundry: Boolean(details?.has_laundry),
    has_parking: Boolean(details?.has_parking),
    has_pool: Boolean(details?.has_pool),
    has_reception: Boolean(details?.has_reception),
    has_restaurant: Boolean(details?.has_restaurant),
    has_security_service: Boolean(details?.has_security_service),
    has_wifi: Boolean(details?.has_wifi),
    hotel_type: details?.hotel_type?.trim() || "hotel_simple",
    is_active: hotel.is_active !== false,
    is_furnished: Boolean(details?.is_furnished),
    is_operational: details?.is_operational !== false,
    nombre_chambres: valueText(details?.nombre_chambres),
    nombre_etages: valueText(details?.nombre_etages),
    nombre_lits_total: valueText(details?.nombre_lits_total),
    nombre_salles_bain: valueText(details?.nombre_salles_bain),
    prix_vente: valueText(hotel.prix_vente),
    standing: details?.standing?.trim() || "standard",
    star_rating: valueText(details?.star_rating || "3"),
    statut: hotel.statut?.trim() || "disponible",
    surface_totale: valueText(hotel.surface_totale),
    title: hotel.title?.trim() ?? "",
    type_transaction: hotel.type_transaction?.trim() || "vente",
  }
}

function buildPatchPayload(values: HotelEditValues) {
  return {
    description: values.description.trim(),
    est_proprietaire: values.est_proprietaire,
    hotel: {
      description_equipements: values.description_equipements.trim(),
      has_bar: values.has_bar,
      has_conference_room: values.has_conference_room,
      has_garden: values.has_garden,
      has_generator: values.has_generator,
      has_laundry: values.has_laundry,
      has_parking: values.has_parking,
      has_pool: values.has_pool,
      has_reception: values.has_reception,
      has_restaurant: values.has_restaurant,
      has_security_service: values.has_security_service,
      has_wifi: values.has_wifi,
      hotel_type: values.hotel_type,
      is_furnished: values.is_furnished,
      is_operational: values.is_operational,
      nombre_chambres: requiredInteger(
        values.nombre_chambres,
        "Le nombre de chambres"
      ),
      nombre_etages: requiredInteger(
        values.nombre_etages,
        "Le nombre d'étages"
      ),
      nombre_lits_total: requiredInteger(
        values.nombre_lits_total,
        "Le nombre total de lits"
      ),
      nombre_salles_bain: requiredInteger(
        values.nombre_salles_bain,
        "Le nombre de salles de bain"
      ),
      standing: values.standing,
      star_rating: requiredInteger(values.star_rating, "Le classement"),
    },
    is_active: values.is_active,
    prix_vente: requiredText(values.prix_vente, "Le prix de vente"),
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
  name: keyof HotelEditValues
  onChange: (name: keyof HotelEditValues, value: string) => void
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
  name: keyof HotelEditValues
  onChange: (name: keyof HotelEditValues, value: string) => void
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

function HotelEditDialog({
  hotel,
  onClose,
  onUpdated,
}: {
  hotel: Hotel
  onClose: () => void
  onUpdated: (hotel: Hotel) => void
}) {
  const [values, setValues] = React.useState<HotelEditValues>(() =>
    formValuesFromHotel(hotel)
  )
  const [error, setError] = React.useState("")
  const [pending, setPending] = React.useState(false)

  function updateValue(name: keyof HotelEditValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function updateBoolean(name: keyof HotelEditValues, checked: boolean) {
    setValues((current) => ({ ...current, [name]: checked }))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const id = hotelId(hotel)

    if (!id) {
      setError("Cet hôtel ne contient pas d'identifiant.")
      return
    }

    setPending(true)

    try {
      const payload = buildPatchPayload(values)
      const updatedHotel = await apiFetch<Partial<Hotel> | undefined>(
        `/api/immovables/hotels/${encodeURIComponent(id)}/`,
        {
          body: JSON.stringify(payload),
          headers: jsonHeaders(),
          method: "PATCH",
        }
      )

      onUpdated({
        ...hotel,
        ...payload,
        ...(updatedHotel ?? {}),
      })
      toast({
        description: "Les informations de l'hôtel ont été mises à jour.",
        title: "Hôtel modifié",
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
      aria-labelledby="edit-hotel-title"
    >
      <form
        className="max-h-[92svh] w-full overflow-y-auto rounded-t-lg border border-border bg-card text-card-foreground shadow-xl sm:max-w-5xl sm:rounded-lg"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              Modification d&apos;hôtel
            </p>
            <h2
              id="edit-hotel-title"
              className="mt-1 truncate text-xl font-semibold"
            >
              {hotelDisplayName(hotel)}
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
                Informations générales de l&apos;hôtel.
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
                label="Prix de vente *"
                name="prix_vente"
                value={values.prix_vente}
                inputMode="decimal"
                required
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
              <h3 className="text-base font-semibold">Hôtel</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Classification, capacité et niveau de service.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <SelectField
                label="Type d'hôtel"
                name="hotel_type"
                value={values.hotel_type}
                options={hotelTypeOptions}
                onChange={updateValue}
              />
              <SelectField
                label="Standing"
                name="standing"
                value={values.standing}
                options={standingOptions}
                onChange={updateValue}
              />
              <TextField
                label="Étoiles *"
                name="star_rating"
                value={values.star_rating}
                inputMode="numeric"
                required
                onChange={updateValue}
              />
              <TextField
                label="Chambres *"
                name="nombre_chambres"
                value={values.nombre_chambres}
                inputMode="numeric"
                required
                onChange={updateValue}
              />
              <TextField
                label="Étages *"
                name="nombre_etages"
                value={values.nombre_etages}
                inputMode="numeric"
                required
                onChange={updateValue}
              />
              <TextField
                label="Lits *"
                name="nombre_lits_total"
                value={values.nombre_lits_total}
                inputMode="numeric"
                required
                onChange={updateValue}
              />
              <TextField
                label="Salles de bain *"
                name="nombre_salles_bain"
                value={values.nombre_salles_bain}
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
                Services, confort et équipements opérationnels.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

export { HotelEditDialog }

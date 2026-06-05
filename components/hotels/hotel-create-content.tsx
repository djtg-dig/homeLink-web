"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  BedDouble,
  Building2,
  CheckCircle2,
  Hotel,
  Loader2,
  Save,
  ShieldCheck,
  Star,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import {
  ImmovableAddressSection,
  type ImmovableAddressSectionHandle,
  type ImmovableAddressSummary,
} from "@/components/localisation/immovable-address-section"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/toaster"
import { ApiError, apiPostJson } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"

type HotelFormValues = {
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

const initialValues: HotelFormValues = {
  description: "",
  description_equipements: "",
  est_proprietaire: true,
  has_bar: true,
  has_conference_room: false,
  has_garden: false,
  has_generator: true,
  has_laundry: true,
  has_parking: true,
  has_pool: false,
  has_reception: true,
  has_restaurant: true,
  has_security_service: true,
  has_wifi: true,
  hotel_type: "hotel_simple",
  is_active: true,
  is_furnished: true,
  is_operational: true,
  nombre_chambres: "",
  nombre_etages: "",
  nombre_lits_total: "",
  nombre_salles_bain: "",
  prix_vente: "",
  standing: "standard",
  star_rating: "3",
  statut: "disponible",
  surface_totale: "",
  title: "",
  type_transaction: "vente",
}

const emptyAddressSummary: ImmovableAddressSummary = {
  administrativeArea: "",
  country: "",
  formattedAddress: "",
  locality: "",
  street: "",
  subLocality: "",
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

const equipmentFields: Array<{ label: string; name: keyof HotelFormValues }> = [
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
  "min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
const labelClassName = "text-sm font-medium text-foreground"

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

function fieldValue(value: string) {
  return value.trim() || "-"
}

function selectedLabel(
  options: Array<{ label: string; value: string }>,
  value: string
) {
  return options.find((option) => option.value === value)?.label ?? "-"
}

function selectedEquipmentLabels(values: HotelFormValues) {
  return equipmentFields.filter((field) => Boolean(values[field.name]))
}

function TextField({
  inputMode,
  label,
  name,
  onChange,
  placeholder,
  required,
  type = "text",
  value,
}: {
  inputMode?: "decimal" | "numeric" | "text"
  label: string
  name: keyof HotelFormValues
  onChange: (name: keyof HotelFormValues, value: string) => void
  placeholder?: string
  required?: boolean
  type?: string
  value: string
}) {
  return (
    <div className="space-y-2">
      <label className={labelClassName} htmlFor={name}>
        {label}
      </label>
      <input
        className={inputClassName}
        id={name}
        name={name}
        type={type}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
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
  name: keyof HotelFormValues
  onChange: (name: keyof HotelFormValues, value: string) => void
  options: Array<{ label: string; value: string }>
  value: string
}) {
  return (
    <div className="space-y-2">
      <label className={labelClassName} htmlFor={name}>
        {label}
      </label>
      <Select
        value={value}
        onValueChange={(nextValue) => onChange(name, nextValue)}
      >
        <SelectTrigger id={name} className="h-10 w-full rounded-md">
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

function Section({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: React.ReactNode
  description: string
  icon: LucideIcon
  title: string
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="mb-5 flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  )
}

function HotelCreateContent() {
  const router = useRouter()
  const addressSectionRef = React.useRef<ImmovableAddressSectionHandle>(null)
  const [values, setValues] = React.useState<HotelFormValues>(initialValues)
  const [addressSummary, setAddressSummary] =
    React.useState<ImmovableAddressSummary>(emptyAddressSummary)
  const [error, setError] = React.useState("")
  const [pending, setPending] = React.useState(false)

  function updateValue(name: keyof HotelFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function updateBoolean(name: keyof HotelFormValues, checked: boolean) {
    setValues((current) => ({ ...current, [name]: checked }))
  }

  function buildPayload() {
    if (!addressSectionRef.current) {
      throw new Error("Le formulaire d'adresse est indisponible.")
    }

    const address = addressSectionRef.current.getAddressPayload()
    const title = requiredText(values.title, "Le titre")
    const surfaceTotale = requiredText(
      values.surface_totale,
      "La surface totale"
    )
    const prixVente = requiredText(values.prix_vente, "Le prix de vente")

    return {
      adresse: address,
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
      prix_vente: prixVente,
      statut: values.statut,
      surface_totale: surfaceTotale,
      title,
      type_transaction: values.type_transaction,
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setPending(true)

    try {
      const payload = buildPayload()

      await apiPostJson<unknown>("/api/immovables/hotels/", payload)
      toast({
        description: "L'hôtel est maintenant disponible dans la gestion.",
        title: "Hôtel créé",
        variant: "success",
      })
      router.push("/dashboard/hotels")
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(formatApiMessage(caughtError.body, "Création impossible."))
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Création impossible."
        )
      }
    } finally {
      setPending(false)
    }
  }

  const selectedEquipments = selectedEquipmentLabels(values)

  return (
    <DashboardShell
      title="Nouvel hôtel"
      breadcrumbs={[
        { href: "/dashboard/hotels", label: "Hôtels" },
        { label: "Création" },
      ]}
    >
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Création d&apos;hôtel
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Enregistrer un hôtel entier
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Renseignez les informations du bien, son adresse, sa capacité et
              les équipements disponibles.
            </p>
          </div>
          <span className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
            Hôtel entier
          </span>
        </div>
      </section>

      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
        onSubmit={onSubmit}
      >
        <div className="space-y-6">
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Section
            icon={Hotel}
            title="Informations principales"
            description="Données visibles dans la fiche de publication."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Titre *"
                name="title"
                value={values.title}
                required
                onChange={updateValue}
                placeholder="Hôtel du Centre"
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
                placeholder="1200.00"
              />
              <TextField
                label="Prix de vente *"
                name="prix_vente"
                value={values.prix_vente}
                inputMode="decimal"
                required
                onChange={updateValue}
                placeholder="450000.00"
              />
              <div className="space-y-2 md:col-span-2">
                <label className={labelClassName} htmlFor="description">
                  Description
                </label>
                <textarea
                  className={textAreaClassName}
                  id="description"
                  name="description"
                  value={values.description}
                  placeholder="Hôtel entier à vendre"
                  onChange={(event) =>
                    updateValue("description", event.target.value)
                  }
                />
              </div>
              <SwitchField
                label="Je suis propriétaire"
                checked={values.est_proprietaire}
                onChange={(checked) =>
                  updateBoolean("est_proprietaire", checked)
                }
              />
              <SwitchField
                label="Hôtel actif"
                checked={values.is_active}
                onChange={(checked) => updateBoolean("is_active", checked)}
              />
            </div>
          </Section>

          <ImmovableAddressSection
            ref={addressSectionRef}
            disabled={pending}
            description="Adresse rattachée à cet hôtel."
            onSummaryChange={setAddressSummary}
          />

          <Section
            icon={Building2}
            title="Classification"
            description="Type d'hôtel, standing et classement."
          >
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
            </div>
          </Section>

          <Section
            icon={BedDouble}
            title="Capacité"
            description="Chambres, étages, lits et salles de bain."
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <TextField
                label="Chambres *"
                name="nombre_chambres"
                value={values.nombre_chambres}
                inputMode="numeric"
                required
                onChange={updateValue}
                placeholder="20"
              />
              <TextField
                label="Étages *"
                name="nombre_etages"
                value={values.nombre_etages}
                inputMode="numeric"
                required
                onChange={updateValue}
                placeholder="3"
              />
              <TextField
                label="Lits *"
                name="nombre_lits_total"
                value={values.nombre_lits_total}
                inputMode="numeric"
                required
                onChange={updateValue}
                placeholder="32"
              />
              <TextField
                label="Salles de bain *"
                name="nombre_salles_bain"
                value={values.nombre_salles_bain}
                inputMode="numeric"
                required
                onChange={updateValue}
                placeholder="20"
              />
            </div>
          </Section>

          <Section
            icon={ShieldCheck}
            title="Équipements"
            description="Services, confort et équipements opérationnels."
          >
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
            <div className="mt-4 space-y-2">
              <label
                className={labelClassName}
                htmlFor="description_equipements"
              >
                Description des équipements
              </label>
              <textarea
                className={textAreaClassName}
                id="description_equipements"
                name="description_equipements"
                value={values.description_equipements}
                placeholder="Réception, restaurant et parking."
                onChange={(event) =>
                  updateValue("description_equipements", event.target.value)
                }
              />
            </div>
          </Section>
        </div>

        <aside className="xl:sticky xl:top-20 xl:self-start">
          <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
            <div className="border-b border-border p-4">
              <h2 className="text-base font-semibold">Récapitulatif</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Aperçu avant validation.
              </p>
            </div>
            <div className="space-y-4 p-4 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Hôtel
                </p>
                <p className="mt-1 font-semibold">{fieldValue(values.title)}</p>
                <p className="mt-1 text-muted-foreground">
                  {selectedLabel(hotelTypeOptions, values.hotel_type)} -{" "}
                  {selectedLabel(standingOptions, values.standing)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Chambres</p>
                  <p className="mt-1 font-medium">
                    {fieldValue(values.nombre_chambres)}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Étoiles</p>
                  <p className="mt-1 flex items-center gap-1 font-medium">
                    <Star className="size-3.5 text-primary" />
                    {fieldValue(values.star_rating)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Adresse
                </p>
                <p className="mt-1">{fieldValue(addressSummary.street)}</p>
                <p className="text-muted-foreground">
                  {[
                    addressSummary.subLocality,
                    addressSummary.locality,
                    addressSummary.administrativeArea,
                    addressSummary.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Équipements
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedEquipments.slice(0, 8).map((field) => (
                    <span
                      key={field.name}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                    >
                      <CheckCircle2 className="size-3" />
                      {field.label}
                    </span>
                  ))}
                  {selectedEquipments.length === 0 ? (
                    <span className="text-muted-foreground">Aucun.</span>
                  ) : null}
                </div>
              </div>
              <Button className="h-10 w-full" type="submit" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <Save />}
                Créer l&apos;hôtel
              </Button>
            </div>
          </div>
        </aside>
      </form>
    </DashboardShell>
  )
}

export { HotelCreateContent }

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  Music,
  Save,
  ShieldCheck,
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

type SalleEvenementFormValues = {
  capacite_max: string
  description: string
  description_equipements: string
  est_proprietaire: boolean
  has_air_conditioning: boolean
  has_generator: boolean
  has_kitchen: boolean
  has_lighting_system: boolean
  has_parking: boolean
  has_projector: boolean
  has_security_service: boolean
  has_sound_system: boolean
  has_stage: boolean
  has_tables_chairs: boolean
  has_toilets: boolean
  is_active: boolean
  is_furnished: boolean
  nombre_salles: string
  prix_location_mensuel: string
  salle_type: string
  statut: string
  surface_salle: string
  surface_totale: string
  title: string
  type_transaction: string
}

const initialValues: SalleEvenementFormValues = {
  capacite_max: "",
  description: "",
  description_equipements: "",
  est_proprietaire: true,
  has_air_conditioning: false,
  has_generator: false,
  has_kitchen: false,
  has_lighting_system: false,
  has_parking: false,
  has_projector: false,
  has_security_service: false,
  has_sound_system: false,
  has_stage: false,
  has_tables_chairs: false,
  has_toilets: false,
  is_active: true,
  is_furnished: false,
  nombre_salles: "",
  prix_location_mensuel: "",
  salle_type: "polyvalente",
  statut: "disponible",
  surface_salle: "",
  surface_totale: "",
  title: "",
  type_transaction: "location",
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
  { label: "Loué", value: "loue" },
]

const transactionOptions = [{ label: "Location", value: "location" }]

const salleTypeOptions = [
  { label: "Mariage", value: "mariage" },
  { label: "Conférence", value: "conference" },
  { label: "Réunion", value: "reunion" },
  { label: "Spectacle", value: "spectacle" },
  { label: "Polyvalente", value: "polyvalente" },
]

const equipmentFields: Array<{
  label: string
  name: keyof SalleEvenementFormValues
}> = [
  { label: "Scène", name: "has_stage" },
  { label: "Sonorisation", name: "has_sound_system" },
  { label: "Éclairage", name: "has_lighting_system" },
  { label: "Projecteur", name: "has_projector" },
  { label: "Tables et chaises", name: "has_tables_chairs" },
  { label: "Cuisine", name: "has_kitchen" },
  { label: "Parking", name: "has_parking" },
  { label: "Générateur", name: "has_generator" },
  { label: "Climatisation", name: "has_air_conditioning" },
  { label: "Service de sécurité", name: "has_security_service" },
  { label: "Toilettes", name: "has_toilets" },
  { label: "Meublée", name: "is_furnished" },
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

function selectedEquipmentLabels(values: SalleEvenementFormValues) {
  return equipmentFields.filter((field) => Boolean(values[field.name]))
}

function TextField({
  inputMode,
  label,
  name,
  onChange,
  placeholder,
  required,
  value,
}: {
  inputMode?: "decimal" | "numeric" | "text"
  label: string
  name: keyof SalleEvenementFormValues
  onChange: (name: keyof SalleEvenementFormValues, value: string) => void
  placeholder?: string
  required?: boolean
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
        type="text"
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
  name: keyof SalleEvenementFormValues
  onChange: (name: keyof SalleEvenementFormValues, value: string) => void
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

function SalleEvenementCreateContent() {
  const router = useRouter()
  const addressSectionRef = React.useRef<ImmovableAddressSectionHandle>(null)
  const [values, setValues] =
    React.useState<SalleEvenementFormValues>(initialValues)
  const [addressSummary, setAddressSummary] =
    React.useState<ImmovableAddressSummary>(emptyAddressSummary)
  const [error, setError] = React.useState("")
  const [pending, setPending] = React.useState(false)

  function updateValue(name: keyof SalleEvenementFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function updateBoolean(
    name: keyof SalleEvenementFormValues,
    checked: boolean
  ) {
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
    const surfaceSalle = requiredText(values.surface_salle, "La surface salle")
    const rent = requiredText(
      values.prix_location_mensuel,
      "Le prix de location mensuel"
    )

    const salleEvenement: Record<string, unknown> = {
      capacite_max: requiredInteger(
        values.capacite_max,
        "La capacité maximale"
      ),
      description_equipements: values.description_equipements.trim(),
      nombre_salles: requiredInteger(
        values.nombre_salles,
        "Le nombre de salles"
      ),
      salle_type: values.salle_type,
      surface_salle: surfaceSalle,
    }

    equipmentFields.forEach((field) => {
      salleEvenement[field.name] = Boolean(values[field.name])
    })

    return {
      adresse: address,
      description: values.description.trim(),
      est_proprietaire: values.est_proprietaire,
      is_active: values.is_active,
      prix_location_mensuel: rent,
      salle_evenement: salleEvenement,
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

      await apiPostJson<unknown>("/api/immovables/salles-evenement/", payload)
      toast({
        description:
          "La salle d'événement est maintenant disponible dans la gestion.",
        title: "Salle créée",
        variant: "success",
      })
      router.push("/dashboard/salles-evenement")
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
      title="Nouvelle salle"
      breadcrumbs={[
        { href: "/dashboard/salles-evenement", label: "Salles événement" },
        { label: "Création" },
      ]}
    >
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Création de salle
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Enregistrer une salle d&apos;événement
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Renseignez les informations du bien, son adresse, sa capacité et
              ses équipements.
            </p>
          </div>
          <span className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
            Location événementielle
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
            icon={CalendarDays}
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
                placeholder="Salle Polyvalente Horizon"
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
                placeholder="800.00"
              />
              <TextField
                label="Loyer mensuel *"
                name="prix_location_mensuel"
                value={values.prix_location_mensuel}
                inputMode="decimal"
                required
                onChange={updateValue}
                placeholder="5000.00"
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
                  placeholder="Grande salle pour mariage et conférence"
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
                label="Salle active"
                checked={values.is_active}
                onChange={(checked) => updateBoolean("is_active", checked)}
              />
            </div>
          </Section>

          <ImmovableAddressSection
            ref={addressSectionRef}
            disabled={pending}
            description="Adresse rattachée à cette salle."
            onSummaryChange={setAddressSummary}
          />

          <Section
            icon={Music}
            title="Salle"
            description="Type, capacité, surface et nombre de salles."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Type de salle"
                name="salle_type"
                value={values.salle_type}
                options={salleTypeOptions}
                onChange={updateValue}
              />
              <TextField
                label="Capacité maximale *"
                name="capacite_max"
                value={values.capacite_max}
                inputMode="numeric"
                required
                onChange={updateValue}
                placeholder="500"
              />
              <TextField
                label="Surface salle *"
                name="surface_salle"
                value={values.surface_salle}
                inputMode="decimal"
                required
                onChange={updateValue}
                placeholder="600.00"
              />
              <TextField
                label="Nombre de salles *"
                name="nombre_salles"
                value={values.nombre_salles}
                inputMode="numeric"
                required
                onChange={updateValue}
                placeholder="2"
              />
            </div>
          </Section>

          <Section
            icon={ShieldCheck}
            title="Équipements"
            description="Services techniques, confort et sécurité disponibles."
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
                placeholder="Sonorisation complète et projecteur."
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
                  Salle
                </p>
                <p className="mt-1 font-semibold">{fieldValue(values.title)}</p>
                <p className="mt-1 text-muted-foreground">
                  {selectedLabel(salleTypeOptions, values.salle_type)} -{" "}
                  {selectedLabel(transactionOptions, values.type_transaction)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Capacité</p>
                  <p className="mt-1 font-medium">
                    {fieldValue(values.capacite_max)}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Surface</p>
                  <p className="mt-1 font-medium">
                    {fieldValue(values.surface_salle)}
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
                Créer la salle
              </Button>
            </div>
          </div>
        </aside>
      </form>
    </DashboardShell>
  )
}

export { SalleEvenementCreateContent }

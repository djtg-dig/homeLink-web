"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  Loader2,
  Package,
  Save,
  ShieldCheck,
  Store,
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

type KiosqueFormValues = {
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

const initialValues: KiosqueFormValues = {
  description: "",
  description_equipements: "",
  est_proprietaire: true,
  has_electricity: true,
  has_security_grid: true,
  has_storage: true,
  has_water: false,
  is_active: true,
  is_furnished: true,
  is_movable: false,
  kiosque_type: "mobile_money",
  opening_side_count: "2",
  prix_location_mensuel: "",
  prix_vente: "",
  statut: "disponible",
  surface: "",
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
  name: keyof KiosqueFormValues
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

function optionalText(value: string) {
  const nextValue = value.trim()

  return nextValue || undefined
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

function selectedEquipmentLabels(values: KiosqueFormValues) {
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
  name: keyof KiosqueFormValues
  onChange: (name: keyof KiosqueFormValues, value: string) => void
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
  name: keyof KiosqueFormValues
  onChange: (name: keyof KiosqueFormValues, value: string) => void
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

function KiosqueCreateContent() {
  const router = useRouter()
  const addressSectionRef = React.useRef<ImmovableAddressSectionHandle>(null)
  const [values, setValues] = React.useState<KiosqueFormValues>(initialValues)
  const [addressSummary, setAddressSummary] =
    React.useState<ImmovableAddressSummary>(emptyAddressSummary)
  const [error, setError] = React.useState("")
  const [pending, setPending] = React.useState(false)

  function updateValue(name: keyof KiosqueFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function updateBoolean(name: keyof KiosqueFormValues, checked: boolean) {
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
    const price =
      values.type_transaction === "vente"
        ? requiredText(values.prix_vente, "Le prix de vente")
        : requiredText(
            values.prix_location_mensuel,
            "Le prix de location mensuel"
          )

    return {
      adresse: address,
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

      await apiPostJson<unknown>("/api/immovables/kiosques/", payload)
      toast({
        description: "Le kiosque est maintenant disponible dans la gestion.",
        title: "Kiosque créé",
        variant: "success",
      })
      router.push("/dashboard/kiosques")
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
      title="Nouveau kiosque"
      breadcrumbs={[
        { href: "/dashboard/kiosques", label: "Kiosques" },
        { label: "Création" },
      ]}
    >
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Création de kiosque
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Enregistrer un kiosque
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Renseignez les informations du bien, son adresse, sa surface et
              ses équipements commerciaux.
            </p>
          </div>
          <span className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
            Petite surface commerciale
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
            icon={Store}
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
                placeholder="Kiosque Mobile Money"
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
                placeholder="12.00"
              />
              <TextField
                label="Loyer mensuel"
                name="prix_location_mensuel"
                value={values.prix_location_mensuel}
                inputMode="decimal"
                onChange={updateValue}
                placeholder="150.00"
              />
              <TextField
                label="Prix de vente"
                name="prix_vente"
                value={values.prix_vente}
                inputMode="decimal"
                onChange={updateValue}
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
                  placeholder="Petit kiosque commercial"
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
                label="Kiosque actif"
                checked={values.is_active}
                onChange={(checked) => updateBoolean("is_active", checked)}
              />
            </div>
          </Section>

          <ImmovableAddressSection
            ref={addressSectionRef}
            disabled={pending}
            description="Adresse rattachée à ce kiosque."
            onSummaryChange={setAddressSummary}
          />

          <Section
            icon={Package}
            title="Kiosque"
            description="Type, surface, ouvertures et équipements internes."
          >
            <div className="grid gap-4 md:grid-cols-2">
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
                placeholder="9.50"
              />
              <TextField
                label="Nombre d'ouvertures *"
                name="opening_side_count"
                value={values.opening_side_count}
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
            description="Services disponibles, sécurité et aménagement du kiosque."
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
                placeholder="Grille de sécurité et rangement intérieur."
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
                  Kiosque
                </p>
                <p className="mt-1 font-semibold">{fieldValue(values.title)}</p>
                <p className="mt-1 text-muted-foreground">
                  {selectedLabel(kiosqueTypeOptions, values.kiosque_type)} -{" "}
                  {selectedLabel(transactionOptions, values.type_transaction)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Surface</p>
                  <p className="mt-1 font-medium">
                    {fieldValue(values.surface)}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Ouvertures</p>
                  <p className="mt-1 font-medium">
                    {fieldValue(values.opening_side_count)}
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
                  {selectedEquipments.map((field) => (
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
                Créer le kiosque
              </Button>
            </div>
          </div>
        </aside>
      </form>
    </DashboardShell>
  )
}

export { KiosqueCreateContent }

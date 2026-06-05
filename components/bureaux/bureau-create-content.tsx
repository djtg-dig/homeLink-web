"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  BriefcaseBusiness,
  CheckCircle2,
  Home,
  KeyRound,
  Loader2,
  PanelsTopLeft,
  Save,
  ShieldCheck,
} from "lucide-react"

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
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toaster"
import {
  agencyDisplayName,
  parseAgencies,
  type AgenciesResponse,
  type Agency,
} from "@/lib/agencies"
import { ApiError, apiFetch, apiPostJson } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"

const NO_AGENCY_VALUE = "__none__"

type BureauFormValues = {
  agency_id: string
  alarm: boolean
  area: string
  available_from: string
  charges: string
  condition: string
  deposit_months: string
  description: string
  digicode: boolean
  door_number: string
  est_proprietaire: boolean
  floor_number: string
  floor_plan: string
  furniture_description: string
  furniture_included: boolean
  has_false_ceiling: boolean
  has_individual_ac: boolean
  has_individual_heating: boolean
  has_private_bathroom: boolean
  has_private_entrance: boolean
  has_private_kitchen: boolean
  has_private_terrace: boolean
  has_raised_floor: boolean
  has_wifi: boolean
  interphone: boolean
  is_active: boolean
  is_available: boolean
  lease_type: string
  max_capacity: string
  minimum_lease_months: string
  monthly_rent: string
  network_ports: string
  office_type: string
  open_space_area: string
  private_offices_count: string
  prix_location_mensuel: string
  prix_vente: string
  recommended_capacity: string
  statut: string
  surface_habitable: string
  surface_totale: string
  title: string
  type_transaction: string
  virtual_tour_url: string
  watch_camera: boolean
  wing: string
}

const initialValues: BureauFormValues = {
  agency_id: NO_AGENCY_VALUE,
  alarm: false,
  area: "",
  available_from: "",
  charges: "",
  condition: "neuf",
  deposit_months: "",
  description: "",
  digicode: false,
  door_number: "",
  est_proprietaire: true,
  floor_number: "",
  floor_plan: "",
  furniture_description: "",
  furniture_included: false,
  has_false_ceiling: false,
  has_individual_ac: false,
  has_individual_heating: false,
  has_private_bathroom: false,
  has_private_entrance: false,
  has_private_kitchen: false,
  has_private_terrace: false,
  has_raised_floor: false,
  has_wifi: true,
  interphone: false,
  is_active: true,
  is_available: true,
  lease_type: "meuble",
  max_capacity: "",
  minimum_lease_months: "",
  monthly_rent: "",
  network_ports: "",
  office_type: "open_space",
  open_space_area: "",
  private_offices_count: "",
  prix_location_mensuel: "",
  prix_vente: "",
  recommended_capacity: "",
  statut: "disponible",
  surface_habitable: "",
  surface_totale: "",
  title: "",
  type_transaction: "vente",
  virtual_tour_url: "",
  watch_camera: false,
  wing: "",
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
  { label: "Loué", value: "loue" },
]

const transactionOptions = [
  { label: "Vente", value: "vente" },
  { label: "Location", value: "location" },
]

const officeTypeOptions = [
  { label: "Open space", value: "open_space" },
  { label: "Bureau privé", value: "private_office" },
  { label: "Bureau partagé", value: "shared_office" },
  { label: "Coworking", value: "coworking" },
]

const conditionOptions = [
  { label: "Neuf", value: "neuf" },
  { label: "Rénové", value: "renove" },
  { label: "Bon état", value: "bon_etat" },
  { label: "À rénover", value: "a_renover" },
]

const leaseTypeOptions = [
  { label: "Meublé", value: "meuble" },
  { label: "Nu", value: "nu" },
  { label: "Flexible", value: "flexible" },
]

const securityFields: Array<{ label: string; name: keyof BureauFormValues }> = [
  { label: "Alarme", name: "alarm" },
  { label: "Caméras", name: "watch_camera" },
  { label: "Digicode", name: "digicode" },
  { label: "Interphone", name: "interphone" },
]

const comfortFields: Array<{ label: string; name: keyof BureauFormValues }> = [
  { label: "Entrée privée", name: "has_private_entrance" },
  { label: "Terrasse privée", name: "has_private_terrace" },
  { label: "Salle d’eau privée", name: "has_private_bathroom" },
  { label: "Cuisine privée", name: "has_private_kitchen" },
  { label: "Climatisation individuelle", name: "has_individual_ac" },
  { label: "Chauffage individuel", name: "has_individual_heating" },
  { label: "Faux plafond", name: "has_false_ceiling" },
  { label: "Plancher technique", name: "has_raised_floor" },
  { label: "Wi-Fi", name: "has_wifi" },
  { label: "Mobilier inclus", name: "furniture_included" },
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

function optionalText(value: string) {
  const nextValue = value.trim()

  return nextValue || undefined
}

function optionalInteger(value: string, label: string) {
  const nextValue = value.trim()

  if (!nextValue) {
    return undefined
  }

  if (!/^-?\d+$/.test(nextValue)) {
    throw new Error(`${label} doit être un nombre entier.`)
  }

  return Number(nextValue)
}

function selectedLabel(
  options: Array<{ label: string; value: string }>,
  value: string
) {
  return options.find((option) => option.value === value)?.label ?? "-"
}

function fieldValue(value: string) {
  return value.trim() || "-"
}

function selectedAgencyName(agencies: Agency[], agencyId: string) {
  if (agencyId === NO_AGENCY_VALUE) {
    return "Sans agence"
  }

  const agency = agencies.find((item) => String(item.id ?? "") === agencyId)

  return agency ? agencyDisplayName(agency) : "-"
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
  name: keyof BureauFormValues
  onChange: (name: keyof BureauFormValues, value: string) => void
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
  name: keyof BureauFormValues
  onChange: (name: keyof BureauFormValues, value: string) => void
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
  icon: typeof BriefcaseBusiness
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

function BureauCreateContent() {
  const router = useRouter()
  const addressSectionRef = React.useRef<ImmovableAddressSectionHandle>(null)
  const [values, setValues] = React.useState<BureauFormValues>(initialValues)
  const [addressSummary, setAddressSummary] =
    React.useState<ImmovableAddressSummary>(emptyAddressSummary)
  const [agencies, setAgencies] = React.useState<Agency[]>([])
  const [agenciesError, setAgenciesError] = React.useState("")
  const [loadingAgencies, setLoadingAgencies] = React.useState(true)
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

  React.useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadAgencies(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadAgencies])

  function updateValue(name: keyof BureauFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function updateBoolean(name: keyof BureauFormValues, checked: boolean) {
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
    const surfaceHabitable = requiredText(
      values.surface_habitable,
      "La surface habitable"
    )
    const price =
      values.type_transaction === "vente"
        ? requiredText(values.prix_vente, "Le prix de vente")
        : requiredText(
            values.prix_location_mensuel,
            "Le prix de location mensuel"
          )

    const bureau: Record<string, unknown> = {
      alarm: values.alarm,
      condition: values.condition,
      digicode: values.digicode,
      furniture_included: values.furniture_included,
      has_false_ceiling: values.has_false_ceiling,
      has_individual_ac: values.has_individual_ac,
      has_individual_heating: values.has_individual_heating,
      has_private_bathroom: values.has_private_bathroom,
      has_private_entrance: values.has_private_entrance,
      has_private_kitchen: values.has_private_kitchen,
      has_private_terrace: values.has_private_terrace,
      has_raised_floor: values.has_raised_floor,
      has_wifi: values.has_wifi,
      interphone: values.interphone,
      is_available: values.is_available,
      lease_type: values.lease_type,
      office_type: values.office_type,
      watch_camera: values.watch_camera,
    }

    const textFields: Array<keyof BureauFormValues> = [
      "door_number",
      "wing",
      "furniture_description",
      "available_from",
      "monthly_rent",
      "charges",
      "virtual_tour_url",
      "floor_plan",
      "area",
      "open_space_area",
    ]

    textFields.forEach((field) => {
      const value = optionalText(values[field] as string)

      if (value !== undefined) {
        bureau[field] = value
      }
    })

    const integerFields: Array<keyof BureauFormValues> = [
      "floor_number",
      "private_offices_count",
      "max_capacity",
      "recommended_capacity",
      "network_ports",
      "minimum_lease_months",
      "deposit_months",
    ]

    integerFields.forEach((field) => {
      const value = optionalInteger(values[field] as string, String(field))

      if (value !== undefined) {
        bureau[field] = value
      }
    })

    return {
      adresse: address,
      ...(values.agency_id === NO_AGENCY_VALUE
        ? {}
        : { agency_id: values.agency_id }),
      bureau,
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
      surface_habitable: surfaceHabitable,
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

      await apiPostJson<unknown>("/api/immovables/bureaux/", payload)
      toast({
        description: "Le bureau est maintenant disponible dans la gestion.",
        title: "Bureau créé",
        variant: "success",
      })
      router.push("/dashboard/bureaux")
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

  return (
    <DashboardShell
      title="Nouveau bureau"
      breadcrumbs={[
        { href: "/dashboard/bureaux", label: "Bureaux" },
        { label: "Création" },
      ]}
    >
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Création de bureau
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Enregistrer un nouveau bureau
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Renseignez les informations du bien, son adresse, son agence
              éventuelle et les caractéristiques professionnelles.
            </p>
          </div>
          <span className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
            L’agence est optionnelle
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
            icon={Home}
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
                placeholder="Bureau moderne à Kinshasa"
              />
              <div className="space-y-2">
                <label className={labelClassName} htmlFor="agency_id">
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
                    <SelectTrigger id="agency_id" className="h-10 w-full">
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
                placeholder="250"
              />
              <TextField
                label="Surface habitable *"
                name="surface_habitable"
                value={values.surface_habitable}
                inputMode="decimal"
                required
                onChange={updateValue}
                placeholder="210"
              />
              <TextField
                label="Prix de vente"
                name="prix_vente"
                value={values.prix_vente}
                inputMode="decimal"
                onChange={updateValue}
                placeholder="150000"
              />
              <TextField
                label="Loyer mensuel"
                name="prix_location_mensuel"
                value={values.prix_location_mensuel}
                inputMode="decimal"
                onChange={updateValue}
                placeholder="2500"
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
                  placeholder="Présentation courte du bureau"
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
                label="Bureau actif"
                checked={values.is_active}
                onChange={(checked) => updateBoolean("is_active", checked)}
              />
            </div>
          </Section>

          <ImmovableAddressSection
            ref={addressSectionRef}
            disabled={pending}
            description="Adresse rattachée à ce bureau."
            onSummaryChange={setAddressSummary}
          />

          <Section
            icon={BriefcaseBusiness}
            title="Bureau"
            description="Type d’espace, étage, capacité et surfaces professionnelles."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Type de bureau"
                name="office_type"
                value={values.office_type}
                options={officeTypeOptions}
                onChange={updateValue}
              />
              <SelectField
                label="État"
                name="condition"
                value={values.condition}
                options={conditionOptions}
                onChange={updateValue}
              />
              <SelectField
                label="Bail"
                name="lease_type"
                value={values.lease_type}
                options={leaseTypeOptions}
                onChange={updateValue}
              />
              <TextField
                label="Surface bureau"
                name="area"
                value={values.area}
                inputMode="decimal"
                onChange={updateValue}
                placeholder="120"
              />
              <TextField
                label="Surface open space"
                name="open_space_area"
                value={values.open_space_area}
                inputMode="decimal"
                onChange={updateValue}
              />
              <TextField
                label="Étage"
                name="floor_number"
                value={values.floor_number}
                inputMode="numeric"
                onChange={updateValue}
              />
              <TextField
                label="Porte"
                name="door_number"
                value={values.door_number}
                onChange={updateValue}
              />
              <TextField
                label="Aile"
                name="wing"
                value={values.wing}
                onChange={updateValue}
              />
              <TextField
                label="Bureaux privés"
                name="private_offices_count"
                value={values.private_offices_count}
                inputMode="numeric"
                onChange={updateValue}
              />
              <TextField
                label="Capacité maximale"
                name="max_capacity"
                value={values.max_capacity}
                inputMode="numeric"
                onChange={updateValue}
              />
              <TextField
                label="Capacité recommandée"
                name="recommended_capacity"
                value={values.recommended_capacity}
                inputMode="numeric"
                onChange={updateValue}
              />
            </div>
          </Section>

          <Section
            icon={ShieldCheck}
            title="Sécurité"
            description="Contrôles d’accès et surveillance du bureau."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {securityFields.map((field) => (
                <SwitchField
                  key={field.name}
                  label={field.label}
                  checked={Boolean(values[field.name])}
                  onChange={(checked) => updateBoolean(field.name, checked)}
                />
              ))}
            </div>
          </Section>

          <Section
            icon={PanelsTopLeft}
            title="Confort et réseau"
            description="Équipements privés, mobilier, réseau et liens utiles."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {comfortFields.map((field) => (
                <SwitchField
                  key={field.name}
                  label={field.label}
                  checked={Boolean(values[field.name])}
                  onChange={(checked) => updateBoolean(field.name, checked)}
                />
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextField
                label="Ports réseau"
                name="network_ports"
                value={values.network_ports}
                inputMode="numeric"
                onChange={updateValue}
              />
              <TextField
                label="Visite virtuelle"
                name="virtual_tour_url"
                value={values.virtual_tour_url}
                type="url"
                onChange={updateValue}
              />
              <TextField
                label="Plan du bureau"
                name="floor_plan"
                value={values.floor_plan}
                onChange={updateValue}
              />
              <div className="space-y-2">
                <label
                  className={labelClassName}
                  htmlFor="furniture_description"
                >
                  Description du mobilier
                </label>
                <textarea
                  className={textAreaClassName}
                  id="furniture_description"
                  name="furniture_description"
                  value={values.furniture_description}
                  onChange={(event) =>
                    updateValue("furniture_description", event.target.value)
                  }
                />
              </div>
            </div>
          </Section>

          <Section
            icon={KeyRound}
            title="Disponibilité et conditions"
            description="Disponibilité, bail minimum, caution et charges."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Disponible à partir du"
                name="available_from"
                value={values.available_from}
                type="date"
                onChange={updateValue}
              />
              <TextField
                label="Bail minimum (mois)"
                name="minimum_lease_months"
                value={values.minimum_lease_months}
                inputMode="numeric"
                onChange={updateValue}
              />
              <TextField
                label="Loyer du bureau"
                name="monthly_rent"
                value={values.monthly_rent}
                inputMode="decimal"
                onChange={updateValue}
              />
              <TextField
                label="Charges"
                name="charges"
                value={values.charges}
                inputMode="decimal"
                onChange={updateValue}
              />
              <TextField
                label="Caution (mois)"
                name="deposit_months"
                value={values.deposit_months}
                inputMode="numeric"
                onChange={updateValue}
              />
              <SwitchField
                label="Disponible"
                checked={values.is_available}
                onChange={(checked) => updateBoolean("is_available", checked)}
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
                  Bureau
                </p>
                <p className="mt-1 font-semibold">{fieldValue(values.title)}</p>
                <p className="mt-1 text-muted-foreground">
                  {selectedLabel(officeTypeOptions, values.office_type)} -{" "}
                  {selectedLabel(transactionOptions, values.type_transaction)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Surface</p>
                  <p className="mt-1 font-medium">
                    {fieldValue(values.surface_habitable)}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Capacité</p>
                  <p className="mt-1 font-medium">
                    {fieldValue(values.max_capacity)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Agence
                </p>
                <p className="mt-1">
                  {selectedAgencyName(agencies, values.agency_id)}
                </p>
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
                  Options
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[...securityFields, ...comfortFields]
                    .filter((field) => Boolean(values[field.name]))
                    .slice(0, 8)
                    .map((field) => (
                      <span
                        key={field.name}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                      >
                        <CheckCircle2 className="size-3" />
                        {field.label}
                      </span>
                    ))}
                  {[...securityFields, ...comfortFields].some((field) =>
                    Boolean(values[field.name])
                  ) ? null : (
                    <span className="text-muted-foreground">Aucune.</span>
                  )}
                </div>
              </div>
              <Button className="h-10 w-full" type="submit" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <Save />}
                Créer le bureau
              </Button>
            </div>
          </div>
        </aside>
      </form>
    </DashboardShell>
  )
}

export { BureauCreateContent }

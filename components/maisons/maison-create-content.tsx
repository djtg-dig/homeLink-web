"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  Flame,
  Home,
  KeyRound,
  Loader2,
  Save,
  ShieldCheck,
  Trees,
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
const NO_ISOLATION_VALUE = "__none__"

type MaisonFormValues = {
  agency_id: string
  alarm: boolean
  barbecue: boolean
  bathroom_number: string
  building_year: string
  cellar: boolean
  chamber_number: string
  concierge: boolean
  description: string
  digicode: boolean
  domotique: boolean
  dpe: string
  elevator: boolean
  energy_class: string
  escapade_kitchen: boolean
  est_proprietaire: boolean
  fence: boolean
  fireplace: boolean
  garage: boolean
  garden: boolean
  garden_area: string
  garden_shed: boolean
  garner: boolean
  heating: string
  home_cinema: boolean
  home_type: string
  interphone: boolean
  is_active: boolean
  is_isolated: boolean
  isolation: string
  lodger_number: string
  place_number_garage: string
  pool: boolean
  pool_area: string
  premium_material: boolean
  prix_location_mensuel: string
  prix_vente: string
  renowned_architect: string
  renovation_need: boolean
  room_sport: boolean
  security_forward_system: boolean
  spa: boolean
  standing: string
  statut: string
  surface_habitable: string
  surface_totale: string
  terrace: boolean
  terrace_area: string
  title: string
  type_transaction: string
  unused: boolean
  veranda: boolean
  veranda_area: string
  view_sea: boolean
  watch_camera: boolean
}

const initialValues: MaisonFormValues = {
  agency_id: NO_AGENCY_VALUE,
  alarm: false,
  barbecue: false,
  bathroom_number: "",
  building_year: "",
  cellar: false,
  chamber_number: "",
  concierge: false,
  description: "",
  digicode: false,
  domotique: false,
  dpe: "",
  elevator: false,
  energy_class: "A",
  escapade_kitchen: false,
  est_proprietaire: true,
  fence: false,
  fireplace: false,
  garage: false,
  garden: false,
  garden_area: "",
  garden_shed: false,
  garner: false,
  heating: "none",
  home_cinema: false,
  home_type: "standard",
  interphone: false,
  is_active: true,
  is_isolated: false,
  isolation: NO_ISOLATION_VALUE,
  lodger_number: "",
  place_number_garage: "",
  pool: false,
  pool_area: "",
  premium_material: false,
  prix_location_mensuel: "",
  prix_vente: "",
  renowned_architect: "",
  renovation_need: false,
  room_sport: false,
  security_forward_system: false,
  spa: false,
  standing: "standard",
  statut: "disponible",
  surface_habitable: "",
  surface_totale: "",
  terrace: false,
  terrace_area: "",
  title: "",
  type_transaction: "vente",
  unused: false,
  veranda: false,
  veranda_area: "",
  view_sea: false,
  watch_camera: false,
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

const homeTypeOptions = [
  { label: "Standard", value: "standard" },
  { label: "Contemporaine", value: "contemporaine" },
  { label: "Traditionnelle", value: "traditionnelle" },
  { label: "Moderne", value: "moderne" },
  { label: "Fermette", value: "fermette" },
  { label: "Chalet", value: "chalet" },
]

const standingOptions = [
  { label: "Standard", value: "standard" },
  { label: "Haut standing", value: "haut_standing" },
  { label: "Luxe", value: "luxe" },
]

const energyClassOptions = ["A", "B", "C", "D", "E", "F", "G"].map((value) => ({
  label: value,
  value,
}))

const heatingOptions = [
  { label: "Aucun", value: "none" },
  { label: "Électrique", value: "electrique" },
  { label: "Gaz", value: "gaz" },
  { label: "Fioul", value: "fioul" },
  { label: "Bois", value: "bois" },
  { label: "Pompe à chaleur", value: "pompe_chaleur" },
  { label: "Solaire", value: "solaire" },
  { label: "Géothermique", value: "geothermique" },
]

const isolationOptions = [
  { label: "Non renseignée", value: NO_ISOLATION_VALUE },
  { label: "Laine de verre", value: "laine_verre" },
  { label: "Laine de roche", value: "laine_roche" },
  { label: "Polystyrène", value: "polystyrene" },
  { label: "Ouate de cellulose", value: "ouate_cellulose" },
  { label: "Liège", value: "liege" },
  { label: "Fibre de bois", value: "fibre_bois" },
]

const booleanFields: Array<{ label: string; name: keyof MaisonFormValues }> = [
  { label: "Maison isolée", name: "is_isolated" },
  { label: "Cuisine équipée", name: "escapade_kitchen" },
  { label: "Jardin", name: "garden" },
  { label: "Terrasse", name: "terrace" },
  { label: "Garage", name: "garage" },
  { label: "Piscine", name: "pool" },
  { label: "Véranda", name: "veranda" },
  { label: "Barbecue", name: "barbecue" },
  { label: "Abri de jardin", name: "garden_shed" },
  { label: "Clôture", name: "fence" },
  { label: "Cheminée", name: "fireplace" },
  { label: "Alarme", name: "alarm" },
  { label: "Caméras", name: "watch_camera" },
  { label: "Digicode", name: "digicode" },
  { label: "Interphone", name: "interphone" },
  { label: "Sécurité avancée", name: "security_forward_system" },
  { label: "Ascenseur", name: "elevator" },
  { label: "Cave", name: "cellar" },
  { label: "Grenier", name: "garner" },
  { label: "Vue mer", name: "view_sea" },
  { label: "Salle de sport", name: "room_sport" },
  { label: "Home cinéma", name: "home_cinema" },
  { label: "Spa", name: "spa" },
  { label: "Domotique", name: "domotique" },
  { label: "Concierge", name: "concierge" },
  { label: "Matériaux premium", name: "premium_material" },
  { label: "Inoccupée", name: "unused" },
  { label: "Rénovation nécessaire", name: "renovation_need" },
]

const compositionFields = [
  { label: "Chambres", name: "chamber_number", required: false },
  { label: "Salles de bain", name: "bathroom_number", required: false },
  { label: "Occupants", name: "lodger_number", required: false },
  { label: "Année de construction *", name: "building_year", required: true },
] as const

const areaFields = [
  { label: "Surface jardin", name: "garden_area" },
  { label: "Surface terrasse", name: "terrace_area" },
  { label: "Surface piscine", name: "pool_area" },
  { label: "Surface véranda", name: "veranda_area" },
] as const

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

function requiredInteger(value: string, label: string) {
  const nextValue = requiredText(value, label)

  if (!/^\d+$/.test(nextValue)) {
    throw new Error(`${label} doit être un nombre entier.`)
  }

  return Number(nextValue)
}

function optionalDecimal(value: string, label: string) {
  const nextValue = value.trim()

  if (!nextValue) {
    return undefined
  }

  if (!/^-?\d+([.,]\d+)?$/.test(nextValue)) {
    throw new Error(`${label} doit être un nombre.`)
  }

  return Number(nextValue.replace(",", "."))
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

function selectedAgencyName(agencies: Agency[], agencyId: string) {
  if (agencyId === NO_AGENCY_VALUE) {
    return "Sans agence"
  }

  const agency = agencies.find((item) => String(item.id ?? "") === agencyId)

  return agency ? agencyDisplayName(agency) : "-"
}

function selectedBooleanLabels(values: MaisonFormValues) {
  return booleanFields.filter((field) => Boolean(values[field.name]))
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
  name: keyof MaisonFormValues
  onChange: (name: keyof MaisonFormValues, value: string) => void
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
  name: keyof MaisonFormValues
  onChange: (name: keyof MaisonFormValues, value: string) => void
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

function MaisonCreateContent() {
  const router = useRouter()
  const addressSectionRef = React.useRef<ImmovableAddressSectionHandle>(null)
  const [values, setValues] = React.useState<MaisonFormValues>(initialValues)
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

  function updateValue(name: keyof MaisonFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function updateBoolean(name: keyof MaisonFormValues, checked: boolean) {
    setValues((current) => ({ ...current, [name]: checked }))
  }

  function buildMaisonPayload() {
    const maison: Record<string, unknown> = {
      building_year: requiredInteger(
        values.building_year,
        "L'année de construction"
      ),
      energy_class: values.energy_class,
      heating: values.heating,
      home_type: values.home_type,
      isolation:
        values.isolation === NO_ISOLATION_VALUE ? null : values.isolation,
      standing: values.standing,
    }

    booleanFields.forEach((field) => {
      maison[field.name] = Boolean(values[field.name])
    })

    const integerFields: Array<keyof MaisonFormValues> = [
      "bathroom_number",
      "chamber_number",
      "lodger_number",
      "place_number_garage",
    ]

    integerFields.forEach((field) => {
      const value = optionalInteger(values[field] as string, String(field))

      if (value !== undefined) {
        maison[field] = value
      }
    })

    areaFields.forEach((field) => {
      const value = optionalDecimal(values[field.name], field.label)

      if (value !== undefined) {
        maison[field.name] = value
      }
    })

    const architect = optionalText(values.renowned_architect)
    const dpe = optionalText(values.dpe)

    if (architect !== undefined) {
      maison.renowned_architect = architect
    }

    if (dpe !== undefined) {
      maison.dpe = dpe
    }

    return maison
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

    return {
      adresse: address,
      ...(values.agency_id === NO_AGENCY_VALUE
        ? {}
        : { agency_id: values.agency_id }),
      description: values.description.trim(),
      est_proprietaire: values.est_proprietaire,
      is_active: values.is_active,
      maison: buildMaisonPayload(),
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

      await apiPostJson<unknown>("/api/immovables/maisons/", payload)
      toast({
        description: "La maison est maintenant disponible dans la gestion.",
        title: "Maison créée",
        variant: "success",
      })
      router.push("/dashboard/maisons")
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

  const selectedOptions = selectedBooleanLabels(values)

  return (
    <DashboardShell
      title="Nouvelle maison"
      breadcrumbs={[
        { href: "/dashboard/maisons", label: "Maisons" },
        { label: "Création" },
      ]}
    >
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Création de maison
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Enregistrer une maison
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Renseignez les informations du bien, son adresse, son agence
              éventuelle et ses caractéristiques détaillées.
            </p>
          </div>
          <span className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
            Maison détaillée
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
                placeholder="Maison familiale"
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
                placeholder="420"
              />
              <TextField
                label="Surface habitable *"
                name="surface_habitable"
                value={values.surface_habitable}
                inputMode="decimal"
                required
                onChange={updateValue}
                placeholder="260"
              />
              <TextField
                label="Prix de vente"
                name="prix_vente"
                value={values.prix_vente}
                inputMode="decimal"
                onChange={updateValue}
                placeholder="180000"
              />
              <TextField
                label="Loyer mensuel"
                name="prix_location_mensuel"
                value={values.prix_location_mensuel}
                inputMode="decimal"
                onChange={updateValue}
                placeholder="1200"
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
                  placeholder="Présentation courte de la maison"
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
                label="Maison active"
                checked={values.is_active}
                onChange={(checked) => updateBoolean("is_active", checked)}
              />
            </div>
          </Section>

          <ImmovableAddressSection
            ref={addressSectionRef}
            disabled={pending}
            description="Adresse rattachée à cette maison."
            onSummaryChange={setAddressSummary}
          />

          <Section
            icon={Flame}
            title="Classification"
            description="Type de maison, standing, énergie, chauffage et isolation."
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <SelectField
                label="Type de maison"
                name="home_type"
                value={values.home_type}
                options={homeTypeOptions}
                onChange={updateValue}
              />
              <SelectField
                label="Standing"
                name="standing"
                value={values.standing}
                options={standingOptions}
                onChange={updateValue}
              />
              <SelectField
                label="Classe énergétique"
                name="energy_class"
                value={values.energy_class}
                options={energyClassOptions}
                onChange={updateValue}
              />
              <SelectField
                label="Chauffage"
                name="heating"
                value={values.heating}
                options={heatingOptions}
                onChange={updateValue}
              />
              <SelectField
                label="Isolation"
                name="isolation"
                value={values.isolation}
                options={isolationOptions}
                onChange={updateValue}
              />
              {compositionFields.map((field) => (
                <TextField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  value={values[field.name]}
                  inputMode="numeric"
                  required={field.required}
                  onChange={updateValue}
                />
              ))}
            </div>
          </Section>

          <Section
            icon={Trees}
            title="Extérieurs et surfaces"
            description="Espaces extérieurs, garage, piscine et surfaces associées."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {booleanFields.slice(0, 10).map((field) => (
                <SwitchField
                  key={field.name}
                  label={field.label}
                  checked={Boolean(values[field.name])}
                  onChange={(checked) => updateBoolean(field.name, checked)}
                />
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {areaFields.map((field) => (
                <TextField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  value={values[field.name]}
                  inputMode="decimal"
                  onChange={updateValue}
                />
              ))}
              <TextField
                label="Places garage"
                name="place_number_garage"
                value={values.place_number_garage}
                inputMode="numeric"
                onChange={updateValue}
              />
            </div>
          </Section>

          <Section
            icon={ShieldCheck}
            title="Sécurité"
            description="Contrôle d’accès, surveillance et protection."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {booleanFields.slice(10, 16).map((field) => (
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
            icon={KeyRound}
            title="Confort et prestige"
            description="Prestations avancées, état du bien et informations complémentaires."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {booleanFields.slice(16).map((field) => (
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
                label="Architecte renommé"
                name="renowned_architect"
                value={values.renowned_architect}
                onChange={updateValue}
              />
              <TextField
                label="DPE"
                name="dpe"
                value={values.dpe}
                onChange={updateValue}
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
                  Maison
                </p>
                <p className="mt-1 font-semibold">{fieldValue(values.title)}</p>
                <p className="mt-1 text-muted-foreground">
                  {selectedLabel(homeTypeOptions, values.home_type)} -{" "}
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
                  <p className="text-xs text-muted-foreground">Chambres</p>
                  <p className="mt-1 font-medium">
                    {fieldValue(values.chamber_number)}
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
                  Options activées
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedOptions.slice(0, 10).map((field) => (
                    <span
                      key={field.name}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                    >
                      <CheckCircle2 className="size-3" />
                      {field.label}
                    </span>
                  ))}
                  {selectedOptions.length === 0 ? (
                    <span className="text-muted-foreground">Aucune.</span>
                  ) : null}
                </div>
              </div>
              <Button className="h-10 w-full" type="submit" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <Save />}
                Créer la maison
              </Button>
            </div>
          </div>
        </aside>
      </form>
    </DashboardShell>
  )
}

export { MaisonCreateContent }

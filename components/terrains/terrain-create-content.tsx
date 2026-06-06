"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Map, Mountain, Save } from "lucide-react"
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

type TerrainFormValues = {
  agency_id: string
  description: string
  est_proprietaire: boolean
  is_active: boolean
  prix_location_mensuel: string
  prix_vente: string
  statut: string
  surface_habitable: string
  surface_terrain: string
  surface_totale: string
  terrain_type: string
  title: string
  topography: string
  type_transaction: string
}

const initialValues: TerrainFormValues = {
  agency_id: NO_AGENCY_VALUE,
  description: "",
  est_proprietaire: true,
  is_active: true,
  prix_location_mensuel: "",
  prix_vente: "",
  statut: "disponible",
  surface_habitable: "",
  surface_terrain: "",
  surface_totale: "",
  terrain_type: "terrain",
  title: "",
  topography: "flat",
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
  { label: "Loué", value: "loue" },
]

const transactionOptions = [
  { label: "Vente", value: "vente" },
  { label: "Location", value: "location" },
]

const terrainTypeOptions = [
  { label: "Terrain", value: "terrain" },
  { label: "Forêt", value: "forest" },
  { label: "Plage", value: "beach" },
  { label: "Montagne", value: "mountain" },
  { label: "Zone urbaine", value: "urban" },
]

const topographyOptions = [
  { label: "Plat", value: "flat" },
  { label: "En pente", value: "sloped" },
  { label: "Escarpé", value: "steep" },
  { label: "Marécageux", value: "marshy" },
  { label: "Boisé", value: "wooded" },
  { label: "Sablonneux", value: "sandy" },
  { label: "Rocheux", value: "rocky" },
  { label: "Agricole", value: "agricultural" },
  { label: "Constructible", value: "buildable" },
  { label: "Non constructible", value: "non_buildable" },
  { label: "En friche", value: "fallow" },
  { label: "Zone inondable", value: "enfriche" },
  { label: "Zone montagneuse", value: "mountainous" },
  { label: "Bord de mer", value: "seaside" },
  { label: "Agricole irrigué", value: "irrigated" },
  { label: "Végétation dense", value: "dense_vegetation" },
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
  name: keyof TerrainFormValues
  onChange: (name: keyof TerrainFormValues, value: string) => void
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
  name: keyof TerrainFormValues
  onChange: (name: keyof TerrainFormValues, value: string) => void
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

function TerrainCreateContent() {
  const router = useRouter()
  const addressSectionRef = React.useRef<ImmovableAddressSectionHandle>(null)
  const [values, setValues] = React.useState<TerrainFormValues>(initialValues)
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

  function updateValue(name: keyof TerrainFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function updateBoolean(name: keyof TerrainFormValues, checked: boolean) {
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
      "La surface exploitable"
    )
    const surfaceTerrain = requiredText(
      values.surface_terrain,
      "La surface du terrain"
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
      terrain: {
        surface_terrain: surfaceTerrain,
        terrain_type: values.terrain_type,
        topography: values.topography,
      },
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

      await apiPostJson<unknown>("/api/immovables/terrains/", payload)
      toast({
        description: "Le terrain est maintenant disponible dans la gestion.",
        title: "Terrain créé",
        variant: "success",
      })
      router.push("/dashboard/terrains")
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
      title="Nouveau terrain"
      breadcrumbs={[
        { href: "/dashboard/terrains", label: "Terrains" },
        { label: "Création" },
      ]}
    >
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Création de terrain
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Enregistrer un terrain
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Renseignez les informations du bien, son adresse, son agence
              éventuelle, son type et sa topographie.
            </p>
          </div>
          <span className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
            Foncier
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
            icon={Map}
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
                placeholder="Terrain constructible"
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
                placeholder="1000"
              />
              <TextField
                label="Surface exploitable *"
                name="surface_habitable"
                value={values.surface_habitable}
                inputMode="decimal"
                required
                onChange={updateValue}
                placeholder="1000"
              />
              <TextField
                label="Prix de vente"
                name="prix_vente"
                value={values.prix_vente}
                inputMode="decimal"
                onChange={updateValue}
                placeholder="50000"
              />
              <TextField
                label="Loyer mensuel"
                name="prix_location_mensuel"
                value={values.prix_location_mensuel}
                inputMode="decimal"
                onChange={updateValue}
                placeholder="300"
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
                  placeholder="Présentation courte du terrain"
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
                label="Terrain actif"
                checked={values.is_active}
                onChange={(checked) => updateBoolean("is_active", checked)}
              />
            </div>
          </Section>

          <ImmovableAddressSection
            ref={addressSectionRef}
            disabled={pending}
            description="Adresse rattachée à ce terrain."
            onSummaryChange={setAddressSummary}
          />

          <Section
            icon={Mountain}
            title="Caractéristiques du terrain"
            description="Surface foncière, type de terrain et topographie."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Surface du terrain *"
                name="surface_terrain"
                value={values.surface_terrain}
                inputMode="decimal"
                required
                onChange={updateValue}
                placeholder="1000"
              />
              <SelectField
                label="Type de terrain"
                name="terrain_type"
                value={values.terrain_type}
                options={terrainTypeOptions}
                onChange={updateValue}
              />
              <div className="md:col-span-2">
                <SelectField
                  label="Topographie"
                  name="topography"
                  value={values.topography}
                  options={topographyOptions}
                  onChange={updateValue}
                />
              </div>
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
                  Terrain
                </p>
                <p className="mt-1 font-semibold">{fieldValue(values.title)}</p>
                <p className="mt-1 text-muted-foreground">
                  {selectedLabel(terrainTypeOptions, values.terrain_type)} -{" "}
                  {selectedLabel(transactionOptions, values.type_transaction)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Surface</p>
                  <p className="mt-1 font-medium">
                    {fieldValue(values.surface_terrain)}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Topographie</p>
                  <p className="mt-1 font-medium">
                    {selectedLabel(topographyOptions, values.topography)}
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
                  Statut
                </p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                  <CheckCircle2 className="size-3" />
                  {selectedLabel(statutOptions, values.statut)}
                </span>
              </div>
              <Button className="h-10 w-full" type="submit" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <Save />}
                Créer le terrain
              </Button>
            </div>
          </div>
        </aside>
      </form>
    </DashboardShell>
  )
}

export { TerrainCreateContent }

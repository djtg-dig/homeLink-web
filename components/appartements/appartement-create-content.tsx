"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2,
  CheckCircle2,
  Home,
  Loader2,
  PanelsTopLeft,
  Ruler,
  Save,
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
import {
  immeubleDisplayName,
  immeubleId,
  immeubleTypeLabel,
  parseImmeubles,
  type Immeuble,
  type ImmeublesResponse,
} from "@/lib/immeubles"

const NO_AGENCY_VALUE = "__none__"

type AppartementFormValues = {
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

const initialValues: AppartementFormValues = {
  agency_id: NO_AGENCY_VALUE,
  balcon: false,
  cave: false,
  cheminee: false,
  classe_energie: "A",
  climatisation: false,
  description: "",
  emission_ges: "A",
  est_proprietaire: true,
  etage: "",
  immeuble: "",
  interphone: false,
  is_active: true,
  jardin: false,
  meuble: false,
  nombre_chambres: "",
  nombre_pieces: "",
  nombre_sdb: "",
  parking: false,
  piscine: false,
  prix_location_mensuel: "",
  prix_vente: "",
  statut: "disponible",
  superficie: "",
  superficie_terrasse: "",
  surface_habitable: "",
  surface_totale: "",
  terrasse: false,
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
  { label: "Loué", value: "loue" },
]

const transactionOptions = [
  { label: "Vente", value: "vente" },
  { label: "Location", value: "location" },
]

const performanceOptions = ["A", "B", "C", "D", "E", "F", "G"]

const comfortFields: Array<{
  label: string
  name: keyof AppartementFormValues
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

function requiredInteger(value: string, label: string) {
  const nextValue = requiredText(value, label)

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

function selectedImmeubleName(immeubles: Immeuble[], selectedId: string) {
  const immeuble = immeubles.find(
    (item) => String(item.id ?? "") === selectedId
  )

  return immeuble ? immeubleDisplayName(immeuble) : "-"
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
  name: keyof AppartementFormValues
  onChange: (name: keyof AppartementFormValues, value: string) => void
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
  name: keyof AppartementFormValues
  onChange: (name: keyof AppartementFormValues, value: string) => void
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
  icon: typeof Building2
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

function AppartementCreateContent() {
  const router = useRouter()
  const addressSectionRef = React.useRef<ImmovableAddressSectionHandle>(null)
  const [values, setValues] =
    React.useState<AppartementFormValues>(initialValues)
  const [addressSummary, setAddressSummary] =
    React.useState<ImmovableAddressSummary>(emptyAddressSummary)
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
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadAgencies])

  React.useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadImmeubles(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadImmeubles])

  function updateValue(name: keyof AppartementFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function updateBoolean(name: keyof AppartementFormValues, checked: boolean) {
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
    const immeuble = requiredInteger(values.immeuble, "L'immeuble")
    const superficie = requiredText(values.superficie, "La superficie")
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
      nombre_pieces: requiredInteger(
        values.nombre_pieces,
        "Le nombre de pièces"
      ),
      nombre_sdb: requiredInteger(
        values.nombre_sdb,
        "Le nombre de salles de bain"
      ),
      parking: values.parking,
      piscine: values.piscine,
      superficie,
      terrasse: values.terrasse,
      immeuble,
    }
    const superficieTerrasse = optionalText(values.superficie_terrasse)

    if (superficieTerrasse) {
      appartement.superficie_terrasse = superficieTerrasse
    }

    return {
      adresse: address,
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

      await apiPostJson<unknown>("/api/immovables/appartements/", payload)
      toast({
        description: "L'appartement est maintenant disponible dans la gestion.",
        title: "Appartement créé",
        variant: "success",
      })
      router.push("/dashboard/appartements")
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
      title="Nouvel appartement"
      breadcrumbs={[
        { href: "/dashboard/appartements", label: "Appartements" },
        { label: "Création" },
      ]}
    >
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Création d&apos;appartement
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Enregistrer un nouvel appartement
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Renseignez les informations du bien, son adresse et les
              caractéristiques de l&apos;appartement.
            </p>
          </div>
          <span className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
            Champs obligatoires marqués par *
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
            description="Détails visibles dans la fiche de publication."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Titre *"
                name="title"
                value={values.title}
                required
                onChange={updateValue}
                placeholder="Appartement moderne à Kinshasa"
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
                      <SelectValue placeholder="Sélectionner une agence" />
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
              <div className="space-y-2">
                <label className={labelClassName} htmlFor="immeuble">
                  Immeuble *
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
                    <SelectTrigger id="immeuble" className="h-10 w-full">
                      <SelectValue placeholder="Sélectionner un immeuble" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/immeubles/new">
                      <Building2 />
                      Créer un immeuble
                    </Link>
                  </Button>
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
                placeholder="120"
              />
              <TextField
                label="Surface habitable *"
                name="surface_habitable"
                value={values.surface_habitable}
                inputMode="decimal"
                required
                onChange={updateValue}
                placeholder="95"
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
                  placeholder="Présentation courte de l'appartement"
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
                label="Appartement actif"
                checked={values.is_active}
                onChange={(checked) => updateBoolean("is_active", checked)}
              />
            </div>
          </Section>

          <ImmovableAddressSection
            ref={addressSectionRef}
            disabled={pending}
            description="Adresse rattachée à cet appartement."
            onSummaryChange={setAddressSummary}
          />

          <Section
            icon={Ruler}
            title="Caractéristiques"
            description="Dimensions, pièces et informations techniques."
          >
            <div className="grid gap-4 md:grid-cols-2">
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
                options={performanceOptions.map((item) => ({
                  label: item,
                  value: item,
                }))}
                onChange={updateValue}
              />
              <SelectField
                label="Émission GES"
                name="emission_ges"
                value={values.emission_ges}
                options={performanceOptions.map((item) => ({
                  label: item,
                  value: item,
                }))}
                onChange={updateValue}
              />
            </div>
          </Section>

          <Section
            icon={PanelsTopLeft}
            title="Confort"
            description="Équipements et options disponibles."
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
                  Appartement
                </p>
                <p className="mt-1 font-semibold">{fieldValue(values.title)}</p>
                <p className="mt-1 text-muted-foreground">
                  {selectedLabel(transactionOptions, values.type_transaction)} -
                  {selectedLabel(statutOptions, values.statut)}
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
                  <p className="text-xs text-muted-foreground">Pièces</p>
                  <p className="mt-1 font-medium">
                    {fieldValue(values.nombre_pieces)}
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
                  Immeuble
                </p>
                <p className="mt-1">
                  {selectedImmeubleName(immeubles, values.immeuble)}
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
                  Équipements
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {comfortFields
                    .filter((field) => Boolean(values[field.name]))
                    .map((field) => (
                      <span
                        key={field.name}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                      >
                        <CheckCircle2 className="size-3" />
                        {field.label}
                      </span>
                    ))}
                  {comfortFields.some((field) =>
                    Boolean(values[field.name])
                  ) ? null : (
                    <span className="text-muted-foreground">Aucun.</span>
                  )}
                </div>
              </div>
              <Button className="h-10 w-full" type="submit" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <Save />}
                Créer l&apos;appartement
              </Button>
            </div>
          </div>
        </aside>
      </form>
    </DashboardShell>
  )
}

export { AppartementCreateContent }

"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  Building2,
  CheckCircle2,
  FileCheck2,
  ImagePlus,
  Loader2,
  MapPin,
  Scale,
  Send,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, apiFetch, apiPostJson } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"

type AgencyFormValues = {
  description: string
  email: string
  is_active: boolean
  legal_name: string
  legal_status: string
  name: string
  phone: string
  rccm_number: string
  tax_number: string
  website: string
}

type AddressFormValues = {
  administrative_area: string
  country: string
  locality: string
  postal_code: string
  street: string
  sub_locality: string
}

type CountryOption = {
  id: number
  iso2?: string
  name: string
  phone_code?: string
}

type AdministrativeAreaOption = {
  country: number
  country_iso2?: string
  country_name?: string
  id: number
  name: string
}

type LocalityOption = {
  administrative_area: number
  administrative_area_name?: string
  country: number
  country_name?: string
  id: number
  name: string
}

type SubLocalityOption = {
  administrative_area: number
  administrative_area_name?: string
  code?: string
  country: number
  country_name?: string
  id: number
  locality: number
  locality_name?: string
  name: string
}

type ListResponse<TItem> =
  | TItem[]
  | {
      next?: string | null
      results?: TItem[]
    }

type FileField =
  | "business_registration_document"
  | "cover_image"
  | "logo"
  | "national_id_document"
  | "proof_of_address"
  | "tax_document"

type FileState = Record<FileField, File | null>

const initialValues: AgencyFormValues = {
  description: "",
  email: "",
  is_active: true,
  legal_name: "",
  legal_status: "",
  name: "",
  phone: "",
  rccm_number: "",
  tax_number: "",
  website: "",
}

const initialAddressValues: AddressFormValues = {
  administrative_area: "",
  country: "",
  locality: "",
  postal_code: "",
  street: "",
  sub_locality: "",
}

const initialFiles: FileState = {
  business_registration_document: null,
  cover_image: null,
  logo: null,
  national_id_document: null,
  proof_of_address: null,
  tax_document: null,
}

const legalStatusOptions = [
  { label: "Entreprise individuelle", value: "individual" },
  { label: "SARL", value: "sarl" },
  { label: "SA", value: "sa" },
  { label: "SAS", value: "sas" },
  { label: "ONG", value: "ong" },
  { label: "Autre", value: "other" },
]

const fileFields: Array<{
  accept: string
  field: FileField
  label: string
}> = [
  { accept: "image/*", field: "logo", label: "Logo" },
  { accept: "image/*", field: "cover_image", label: "Image de couverture" },
  {
    accept: "image/*,.pdf",
    field: "national_id_document",
    label: "Document d'identite",
  },
  {
    accept: "image/*,.pdf",
    field: "business_registration_document",
    label: "Document RCCM",
  },
  { accept: "image/*,.pdf", field: "tax_document", label: "Document fiscal" },
  {
    accept: "image/*,.pdf",
    field: "proof_of_address",
    label: "Preuve d'adresse",
  },
]

const inputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
const textAreaClassName =
  "min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
const labelClassName = "text-sm font-medium text-foreground"

function legalStatusLabel(value: string) {
  return legalStatusOptions.find((item) => item.value === value)?.label || "-"
}

function filled(value: string) {
  return value.trim() || "-"
}

function appendText(formData: FormData, key: string, value: string) {
  const nextValue = value.trim()

  if (nextValue) {
    formData.append(key, nextValue)
  }
}

function optionById<TOption extends { id: number }>(
  options: TOption[],
  value: string
) {
  return options.find((option) => String(option.id) === value)
}

function selectedName<TOption extends { id: number; name: string }>(
  options: TOption[],
  value: string
) {
  return optionById(options, value)?.name ?? "-"
}

function normaliseNextListPath(nextPath: string) {
  try {
    const nextUrl = new URL(nextPath)

    return `${nextUrl.pathname}${nextUrl.search}`
  } catch {
    return nextPath
  }
}

function buildLocalisationPath(path: string, params: Record<string, string>) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value)
    }
  })

  const nextQuery = query.toString()

  return nextQuery ? `${path}?${nextQuery}` : path
}

async function fetchLocalisationList<TItem>(path: string, signal: AbortSignal) {
  const items: TItem[] = []
  let nextPath: string | null = path

  while (nextPath) {
    const response: ListResponse<TItem> = await apiFetch<ListResponse<TItem>>(
      nextPath,
      { signal }
    )

    if (Array.isArray(response)) {
      items.push(...response)
      break
    }

    items.push(...(response.results ?? []))
    nextPath = response.next ? normaliseNextListPath(response.next) : null
  }

  return items
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

function localisationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return formatApiMessage(error.body, fallback)
  }

  return fallback
}

function requiredNumericValue(value: string, label: string) {
  const nextValue = value.trim()

  if (!/^\d+$/.test(nextValue)) {
    throw new Error(`${label} est obligatoire.`)
  }

  return Number(nextValue)
}

function createdAddressId(response: unknown) {
  if (typeof response === "number" || typeof response === "string") {
    return String(response)
  }

  if (response && typeof response === "object" && "id" in response) {
    const value = (response as { id: unknown }).id

    if (typeof value === "number" || typeof value === "string") {
      return String(value)
    }
  }

  if (response && typeof response === "object" && "address" in response) {
    return createdAddressId((response as { address: unknown }).address)
  }

  if (response && typeof response === "object" && "data" in response) {
    return createdAddressId((response as { data: unknown }).data)
  }

  throw new Error("L'adresse creee ne contient pas d'identifiant.")
}

function TextField({
  inputMode,
  label,
  min,
  name,
  onChange,
  placeholder,
  required,
  step,
  type = "text",
  value,
}: {
  inputMode?:
    | "decimal"
    | "email"
    | "none"
    | "numeric"
    | "search"
    | "tel"
    | "text"
    | "url"
  label: string
  min?: string
  name: keyof AgencyFormValues
  onChange: (name: keyof AgencyFormValues, value: string) => void
  placeholder?: string
  required?: boolean
  step?: string
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
        min={min}
        placeholder={placeholder}
        required={required}
        step={step}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </div>
  )
}

function AddressTextField({
  inputMode,
  label,
  name,
  onChange,
  placeholder,
  required,
  value,
}: {
  inputMode?: "numeric" | "text"
  label: string
  name: keyof AddressFormValues
  onChange: (name: keyof AddressFormValues, value: string) => void
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

function AddressSelectField({
  disabled,
  label,
  loading,
  name,
  onChange,
  options,
  placeholder,
  required,
  value,
}: {
  disabled?: boolean
  label: string
  loading?: boolean
  name: keyof AddressFormValues
  onChange: (name: keyof AddressFormValues, value: string) => void
  options: Array<{ label: string; meta?: string; value: string }>
  placeholder: string
  required?: boolean
  value: string
}) {
  return (
    <div className="space-y-2">
      <label className={labelClassName} htmlFor={name}>
        {label}
      </label>
      {loading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <select
          className={inputClassName}
          id={name}
          name={name}
          value={value}
          disabled={disabled}
          required={required}
          onChange={(event) => onChange(name, event.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.meta ? `${option.label} - ${option.meta}` : option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

function FileInput({
  accept,
  file,
  label,
  name,
  onChange,
}: {
  accept: string
  file: File | null
  label: string
  name: FileField
  onChange: (name: FileField, file: File | null) => void
}) {
  return (
    <label className="flex min-h-24 cursor-pointer flex-col justify-between rounded-lg border border-dashed border-border bg-background p-3 transition hover:border-primary/60 hover:bg-secondary/35">
      <span className="flex items-center gap-2 text-sm font-medium">
        <FileCheck2 className="size-4 text-primary" />
        {label}
      </span>
      <span className="mt-3 truncate text-xs text-muted-foreground">
        {file ? file.name : "Aucun fichier selectionne"}
      </span>
      <input
        className="sr-only"
        name={name}
        type="file"
        accept={accept}
        onChange={(event) => onChange(name, event.target.files?.[0] ?? null)}
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

function AgencyCreateContent() {
  const [values, setValues] = useState<AgencyFormValues>(initialValues)
  const [addressValues, setAddressValues] =
    useState<AddressFormValues>(initialAddressValues)
  const [files, setFiles] = useState<FileState>(initialFiles)
  const [error, setError] = useState("")
  const [localisationError, setLocalisationError] = useState("")
  const [success, setSuccess] = useState("")
  const [pending, setPending] = useState(false)
  const [countries, setCountries] = useState<CountryOption[]>([])
  const [administrativeAreas, setAdministrativeAreas] = useState<
    AdministrativeAreaOption[]
  >([])
  const [localities, setLocalities] = useState<LocalityOption[]>([])
  const [subLocalities, setSubLocalities] = useState<SubLocalityOption[]>([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [loadingAdministrativeAreas, setLoadingAdministrativeAreas] =
    useState(false)
  const [loadingLocalities, setLoadingLocalities] = useState(false)
  const [loadingSubLocalities, setLoadingSubLocalities] = useState(false)

  const selectedFiles = useMemo(
    () => Object.entries(files).filter(([, file]) => Boolean(file)),
    [files]
  )

  const countryOptions = useMemo(
    () =>
      countries.map((country) => ({
        label: country.name,
        meta: country.iso2,
        value: String(country.id),
      })),
    [countries]
  )

  const administrativeAreaOptions = useMemo(
    () =>
      administrativeAreas.map((area) => ({
        label: area.name,
        meta: area.country_name,
        value: String(area.id),
      })),
    [administrativeAreas]
  )

  const localityOptions = useMemo(
    () =>
      localities.map((locality) => ({
        label: locality.name,
        meta: locality.administrative_area_name,
        value: String(locality.id),
      })),
    [localities]
  )

  const subLocalityOptions = useMemo(
    () =>
      subLocalities.map((subLocality) => ({
        label: subLocality.name,
        meta: subLocality.code,
        value: String(subLocality.id),
      })),
    [subLocalities]
  )

  const addressSummary = useMemo(
    () => ({
      administrativeArea: selectedName(
        administrativeAreas,
        addressValues.administrative_area
      ),
      country: selectedName(countries, addressValues.country),
      locality: selectedName(localities, addressValues.locality),
      subLocality: selectedName(subLocalities, addressValues.sub_locality),
    }),
    [
      addressValues.administrative_area,
      addressValues.country,
      addressValues.locality,
      addressValues.sub_locality,
      administrativeAreas,
      countries,
      localities,
      subLocalities,
    ]
  )

  useEffect(() => {
    const controller = new AbortController()

    fetchLocalisationList<CountryOption>(
      "/api/localisation/countries/",
      controller.signal
    )
      .then(setCountries)
      .catch((caughtError) => {
        if (!isAbortError(caughtError)) {
          setLocalisationError(
            localisationErrorMessage(
              caughtError,
              "Impossible de charger les pays."
            )
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingCountries(false)
        }
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    if (!addressValues.country) {
      return () => controller.abort()
    }

    fetchLocalisationList<AdministrativeAreaOption>(
      buildLocalisationPath("/api/localisation/administrative-areas/", {
        country_id: addressValues.country,
      }),
      controller.signal
    )
      .then(setAdministrativeAreas)
      .catch((caughtError) => {
        if (!isAbortError(caughtError)) {
          setLocalisationError(
            localisationErrorMessage(
              caughtError,
              "Impossible de charger les divisions administratives."
            )
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingAdministrativeAreas(false)
        }
      })

    return () => controller.abort()
  }, [addressValues.country])

  useEffect(() => {
    const controller = new AbortController()

    if (!addressValues.country || !addressValues.administrative_area) {
      return () => controller.abort()
    }

    fetchLocalisationList<LocalityOption>(
      buildLocalisationPath("/api/localisation/localities/", {
        administrative_area_id: addressValues.administrative_area,
        country_id: addressValues.country,
      }),
      controller.signal
    )
      .then(setLocalities)
      .catch((caughtError) => {
        if (!isAbortError(caughtError)) {
          setLocalisationError(
            localisationErrorMessage(
              caughtError,
              "Impossible de charger les localites."
            )
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingLocalities(false)
        }
      })

    return () => controller.abort()
  }, [addressValues.administrative_area, addressValues.country])

  useEffect(() => {
    const controller = new AbortController()

    if (
      !addressValues.country ||
      !addressValues.administrative_area ||
      !addressValues.locality
    ) {
      return () => controller.abort()
    }

    fetchLocalisationList<SubLocalityOption>(
      buildLocalisationPath("/api/localisation/sub-localities/", {
        administrative_area_id: addressValues.administrative_area,
        country_id: addressValues.country,
        locality_id: addressValues.locality,
      }),
      controller.signal
    )
      .then(setSubLocalities)
      .catch((caughtError) => {
        if (!isAbortError(caughtError)) {
          setLocalisationError(
            localisationErrorMessage(
              caughtError,
              "Impossible de charger les sous-localites."
            )
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingSubLocalities(false)
        }
      })

    return () => controller.abort()
  }, [
    addressValues.administrative_area,
    addressValues.country,
    addressValues.locality,
  ])

  function updateValue(name: keyof AgencyFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function updateAddressValue(name: keyof AddressFormValues, value: string) {
    setLocalisationError("")

    if (name === "country") {
      setAdministrativeAreas([])
      setLocalities([])
      setSubLocalities([])
      setLoadingAdministrativeAreas(Boolean(value))
      setLoadingLocalities(false)
      setLoadingSubLocalities(false)
    }

    if (name === "administrative_area") {
      setLocalities([])
      setSubLocalities([])
      setLoadingLocalities(Boolean(value))
      setLoadingSubLocalities(false)
    }

    if (name === "locality") {
      setSubLocalities([])
      setLoadingSubLocalities(Boolean(value))
    }

    setAddressValues((current) => {
      const nextValues = { ...current, [name]: value }

      if (name === "country") {
        nextValues.administrative_area = ""
        nextValues.locality = ""
        nextValues.sub_locality = ""
      }

      if (name === "administrative_area") {
        nextValues.locality = ""
        nextValues.sub_locality = ""
      }

      if (name === "locality") {
        nextValues.sub_locality = ""
      }

      return nextValues
    })
  }

  function updateFile(name: FileField, file: File | null) {
    setFiles((current) => ({ ...current, [name]: file }))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!values.name.trim()) {
      setError("Le nom de l'agence est obligatoire.")
      return
    }

    let addressPayload: {
      administrative_area: number
      country: number
      locality: number
      postal_code: string
      street: string
      sub_locality: number
    }

    try {
      if (!addressValues.street.trim()) {
        throw new Error("La rue ou avenue est obligatoire.")
      }

      addressPayload = {
        administrative_area: requiredNumericValue(
          addressValues.administrative_area,
          "La division administrative"
        ),
        country: requiredNumericValue(addressValues.country, "Le pays"),
        locality: requiredNumericValue(addressValues.locality, "La localite"),
        postal_code: addressValues.postal_code.trim(),
        street: addressValues.street.trim(),
        sub_locality: requiredNumericValue(
          addressValues.sub_locality,
          "La sous-localite"
        ),
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Adresse invalide."
      )
      return
    }

    setPending(true)

    let currentStep: "address" | "agency" = "address"

    try {
      const addressResponse = await apiPostJson<unknown>(
        "/api/localisation/addresses/",
        addressPayload
      )
      const addressId = createdAddressId(addressResponse)
      const formData = new FormData()

      currentStep = "agency"

      formData.append("name", values.name.trim())
      formData.append("address", addressId)
      formData.append("is_active", values.is_active ? "true" : "false")

      appendText(formData, "description", values.description)
      appendText(formData, "email", values.email)
      appendText(formData, "phone", values.phone)
      appendText(formData, "website", values.website)
      appendText(formData, "legal_name", values.legal_name)
      appendText(formData, "legal_status", values.legal_status)
      appendText(formData, "rccm_number", values.rccm_number)
      appendText(formData, "tax_number", values.tax_number)

      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file)
        }
      })

      await apiFetch<unknown>("/api/agencies/", {
        body: formData,
        method: "POST",
      })
      setSuccess("Adresse creee puis agence creee avec succes.")
    } catch (caughtError) {
      const fallback =
        currentStep === "address"
          ? "Creation de l'adresse impossible."
          : "Creation de l'agence impossible."

      if (caughtError instanceof ApiError) {
        setError(formatApiMessage(caughtError.body, fallback))
        return
      }

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Creation impossible pour le moment."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <DashboardShell
      title="Nouvelle agence"
      breadcrumbs={[
        { href: "/dashboard#agences", label: "Agences" },
        { label: "Creation" },
      ]}
    >
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Creation d&apos;agence
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Enregistrer une nouvelle agence immobiliere
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Renseignez les informations publiques, l&apos;adresse associee,
              les donnees legales et les pieces justificatives avant validation.
            </p>
          </div>
          <span className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
            Champs obligatoires marques par *
          </span>
        </div>
      </section>

      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
        onSubmit={onSubmit}
      >
        <div className="space-y-6">
          {error ? (
            <p
              aria-live="polite"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          {success ? (
            <p
              aria-live="polite"
              className="rounded-lg border border-brand-cyan/35 bg-secondary px-4 py-3 text-sm text-secondary-foreground"
            >
              {success}
            </p>
          ) : null}

          <Section
            icon={Building2}
            title="Informations publiques"
            description="Ces informations definissent la presentation de l'agence."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Nom de l'agence *"
                name="name"
                value={values.name}
                required
                onChange={updateValue}
                placeholder="Ex. Homelink Kinshasa"
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={values.email}
                onChange={updateValue}
                placeholder="contact@agence.com"
              />
              <TextField
                label="Telephone"
                name="phone"
                value={values.phone}
                onChange={updateValue}
                placeholder="+243..."
              />
              <TextField
                label="Site web"
                name="website"
                type="url"
                value={values.website}
                onChange={updateValue}
                placeholder="https://..."
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
                  placeholder="Presentation courte de l'agence"
                  onChange={(event) =>
                    updateValue("description", event.target.value)
                  }
                />
              </div>
            </div>
          </Section>

          <Section
            icon={ImagePlus}
            title="Medias"
            description="Ajoutez le logo et l'image de couverture si disponibles."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {fileFields.slice(0, 2).map((item) => (
                <FileInput
                  key={item.field}
                  accept={item.accept}
                  file={files[item.field]}
                  label={item.label}
                  name={item.field}
                  onChange={updateFile}
                />
              ))}
            </div>
          </Section>

          <Section
            icon={MapPin}
            title="Adresse"
            description="Creez l'adresse qui sera associee a cette agence."
          >
            {localisationError ? (
              <p
                aria-live="polite"
                className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {localisationError}
              </p>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <AddressSelectField
                label="Pays *"
                name="country"
                value={addressValues.country}
                options={countryOptions}
                loading={loadingCountries}
                required
                onChange={updateAddressValue}
                placeholder="Selectionner un pays"
              />
              <AddressSelectField
                label="Division administrative *"
                name="administrative_area"
                value={addressValues.administrative_area}
                options={administrativeAreaOptions}
                loading={loadingAdministrativeAreas}
                disabled={!addressValues.country}
                required
                onChange={updateAddressValue}
                placeholder={
                  addressValues.country
                    ? "Selectionner une division"
                    : "Choisir un pays"
                }
              />
              <AddressSelectField
                label="Localite *"
                name="locality"
                value={addressValues.locality}
                options={localityOptions}
                loading={loadingLocalities}
                disabled={
                  !addressValues.country || !addressValues.administrative_area
                }
                required
                onChange={updateAddressValue}
                placeholder={
                  addressValues.administrative_area
                    ? "Selectionner une localite"
                    : "Choisir une division"
                }
              />
              <AddressSelectField
                label="Sous-localite *"
                name="sub_locality"
                value={addressValues.sub_locality}
                options={subLocalityOptions}
                loading={loadingSubLocalities}
                disabled={
                  !addressValues.country ||
                  !addressValues.administrative_area ||
                  !addressValues.locality
                }
                required
                onChange={updateAddressValue}
                placeholder={
                  addressValues.locality
                    ? "Selectionner une sous-localite"
                    : "Choisir une localite"
                }
              />
              <AddressTextField
                label="Rue / avenue *"
                name="street"
                value={addressValues.street}
                required
                onChange={updateAddressValue}
                placeholder="Avenue de la Justice 10"
              />
              <AddressTextField
                label="Code postal"
                name="postal_code"
                value={addressValues.postal_code}
                inputMode="numeric"
                onChange={updateAddressValue}
                placeholder="0000"
              />
            </div>
          </Section>

          <Section
            icon={Scale}
            title="Informations legales"
            description="Ces donnees facilitent la verification administrative."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Nom legal"
                name="legal_name"
                value={values.legal_name}
                onChange={updateValue}
                placeholder="Raison sociale"
              />
              <div className="space-y-2">
                <label className={labelClassName} htmlFor="legal_status">
                  Statut legal
                </label>
                <select
                  className={inputClassName}
                  id="legal_status"
                  name="legal_status"
                  value={values.legal_status}
                  onChange={(event) =>
                    updateValue("legal_status", event.target.value)
                  }
                >
                  <option value="">Selectionner</option>
                  {legalStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <TextField
                label="Numero RCCM"
                name="rccm_number"
                value={values.rccm_number}
                onChange={updateValue}
              />
              <TextField
                label="Numero fiscal"
                name="tax_number"
                value={values.tax_number}
                onChange={updateValue}
              />
            </div>
          </Section>

          <Section
            icon={FileCheck2}
            title="Documents"
            description="Joignez les pieces utiles pour l'analyse du dossier."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {fileFields.slice(2).map((item) => (
                <FileInput
                  key={item.field}
                  accept={item.accept}
                  file={files[item.field]}
                  label={item.label}
                  name={item.field}
                  onChange={updateFile}
                />
              ))}
            </div>
          </Section>
        </div>

        <aside className="xl:sticky xl:top-20 xl:self-start">
          <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
            <div className="border-b border-border p-4">
              <h2 className="text-base font-semibold">Recapitulatif</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Apercu avant validation.
              </p>
            </div>
            <div className="space-y-4 p-4 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Agence
                </p>
                <p className="mt-1 font-semibold">{filled(values.name)}</p>
                <p className="mt-1 line-clamp-3 text-muted-foreground">
                  {filled(values.description)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <p className="mt-1 font-medium">
                    {values.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Legal</p>
                  <p className="mt-1 truncate font-medium">
                    {legalStatusLabel(values.legal_status)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Contact
                </p>
                <p className="mt-1">{filled(values.email)}</p>
                <p className="text-muted-foreground">{filled(values.phone)}</p>
                <p className="truncate text-muted-foreground">
                  {filled(values.website)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Adresse
                </p>
                <p className="mt-1">{filled(addressValues.street)}</p>
                <p className="text-muted-foreground">
                  {[
                    addressSummary.subLocality,
                    addressSummary.locality,
                    addressSummary.administrativeArea,
                    addressSummary.country,
                  ]
                    .filter((item) => item !== "-")
                    .join(", ") || "-"}
                </p>
                <p className="text-muted-foreground">
                  Code postal : {filled(addressValues.postal_code)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Documents
                </p>
                <div className="mt-2 space-y-2">
                  {selectedFiles.length > 0 ? (
                    selectedFiles.map(([key, file]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                      >
                        <span className="truncate text-muted-foreground">
                          {file?.name}
                        </span>
                        <CheckCircle2 className="size-4 shrink-0 text-primary" />
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">Aucun fichier.</p>
                  )}
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <span>
                  <span className="block font-medium">Agence active</span>
                  <span className="text-xs text-muted-foreground">
                    Rendre l&apos;agence disponible sur la plateforme.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={values.is_active}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      is_active: event.target.checked,
                    }))
                  }
                  className="size-4 accent-primary"
                />
              </label>

              <Button className="h-10 w-full" type="submit" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <Send />}
                Creer l&apos;agence
              </Button>
            </div>
          </div>
        </aside>
      </form>
    </DashboardShell>
  )
}

export { AgencyCreateContent }

"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useState,
} from "react"
import { MapPin } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, apiFetch, apiPostJson } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

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

type AddressCreateResponse =
  | number
  | string
  | {
      address?: AddressCreateResponse
      data?: AddressCreateResponse
      id?: null | number | string
    }

type AddressSummary = {
  administrativeArea: string
  country: string
  locality: string
  postalCode: string
  street: string
  subLocality: string
}

type AddressCreateSectionHandle = {
  createAddress: () => Promise<string>
}

type AddressCreateSectionProps = {
  className?: string
  description?: string
  disabled?: boolean
  onSummaryChange?: (summary: AddressSummary) => void
  title?: string
}

const initialAddressValues: AddressFormValues = {
  administrative_area: "",
  country: "",
  locality: "",
  postal_code: "",
  street: "",
  sub_locality: "",
}

const emptyAddressSummary: AddressSummary = {
  administrativeArea: "",
  country: "",
  locality: "",
  postalCode: "",
  street: "",
  subLocality: "",
}

const inputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
const labelClassName = "text-sm font-medium text-foreground"

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
  return optionById(options, value)?.name ?? ""
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

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return formatApiMessage(error.body, fallback)
  }

  if (error instanceof Error) {
    return error.message
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

function createdAddressId(response: AddressCreateResponse): string {
  if (typeof response === "number" || typeof response === "string") {
    return String(response)
  }

  if (response.id !== null && response.id !== undefined) {
    return String(response.id)
  }

  if (response.address !== undefined) {
    return createdAddressId(response.address)
  }

  if (response.data !== undefined) {
    return createdAddressId(response.data)
  }

  throw new Error("L'adresse creee ne contient pas d'identifiant.")
}

function AddressTextField({
  disabled,
  id,
  inputMode,
  label,
  name,
  onChange,
  placeholder,
  required,
  value,
}: {
  disabled?: boolean
  id: string
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
      <label className={labelClassName} htmlFor={id}>
        {label}
      </label>
      <input
        className={inputClassName}
        id={id}
        name={name}
        type="text"
        value={value}
        disabled={disabled}
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
  id,
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
  id: string
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
      <label className={labelClassName} htmlFor={id}>
        {label}
      </label>
      {loading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <select
          className={inputClassName}
          id={id}
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

const AddressCreateSection = forwardRef<
  AddressCreateSectionHandle,
  AddressCreateSectionProps
>(function AddressCreateSection(
  {
    className,
    description = "Creez l'adresse a associer au dossier.",
    disabled = false,
    onSummaryChange,
    title = "Adresse",
  },
  ref
) {
  const idPrefix = useId()
  const [values, setValues] = useState<AddressFormValues>(initialAddressValues)
  const [error, setError] = useState("")
  const [createdAddress, setCreatedAddress] = useState<{
    id: string
    signature: string
  } | null>(null)
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

  const summary = useMemo<AddressSummary>(
    () => ({
      administrativeArea: selectedName(
        administrativeAreas,
        values.administrative_area
      ),
      country: selectedName(countries, values.country),
      locality: selectedName(localities, values.locality),
      postalCode: values.postal_code.trim(),
      street: values.street.trim(),
      subLocality: selectedName(subLocalities, values.sub_locality),
    }),
    [
      values.administrative_area,
      values.country,
      values.locality,
      values.postal_code,
      values.street,
      values.sub_locality,
      administrativeAreas,
      countries,
      localities,
      subLocalities,
    ]
  )

  const addressSignature = useMemo(
    () =>
      JSON.stringify({
        administrative_area: values.administrative_area,
        country: values.country,
        locality: values.locality,
        postal_code: values.postal_code.trim(),
        street: values.street.trim(),
        sub_locality: values.sub_locality,
      }),
    [
      values.administrative_area,
      values.country,
      values.locality,
      values.postal_code,
      values.street,
      values.sub_locality,
    ]
  )

  useEffect(() => {
    onSummaryChange?.(summary)
  }, [onSummaryChange, summary])

  useEffect(() => {
    const controller = new AbortController()

    fetchLocalisationList<CountryOption>(
      "/api/localisation/countries/",
      controller.signal
    )
      .then(setCountries)
      .catch((caughtError) => {
        if (!isAbortError(caughtError)) {
          setError(
            toErrorMessage(caughtError, "Impossible de charger les pays.")
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

    if (!values.country) {
      return () => controller.abort()
    }

    fetchLocalisationList<AdministrativeAreaOption>(
      buildLocalisationPath("/api/localisation/administrative-areas/", {
        country_id: values.country,
      }),
      controller.signal
    )
      .then(setAdministrativeAreas)
      .catch((caughtError) => {
        if (!isAbortError(caughtError)) {
          setError(
            toErrorMessage(
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
  }, [values.country])

  useEffect(() => {
    const controller = new AbortController()

    if (!values.country || !values.administrative_area) {
      return () => controller.abort()
    }

    fetchLocalisationList<LocalityOption>(
      buildLocalisationPath("/api/localisation/localities/", {
        administrative_area_id: values.administrative_area,
        country_id: values.country,
      }),
      controller.signal
    )
      .then(setLocalities)
      .catch((caughtError) => {
        if (!isAbortError(caughtError)) {
          setError(
            toErrorMessage(caughtError, "Impossible de charger les localites.")
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingLocalities(false)
        }
      })

    return () => controller.abort()
  }, [values.administrative_area, values.country])

  useEffect(() => {
    const controller = new AbortController()

    if (!values.country || !values.administrative_area || !values.locality) {
      return () => controller.abort()
    }

    fetchLocalisationList<SubLocalityOption>(
      buildLocalisationPath("/api/localisation/sub-localities/", {
        administrative_area_id: values.administrative_area,
        country_id: values.country,
        locality_id: values.locality,
      }),
      controller.signal
    )
      .then(setSubLocalities)
      .catch((caughtError) => {
        if (!isAbortError(caughtError)) {
          setError(
            toErrorMessage(
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
  }, [values.administrative_area, values.country, values.locality])

  function updateValue(name: keyof AddressFormValues, value: string) {
    setError("")
    setCreatedAddress(null)

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

    setValues((current) => {
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

  const createAddress = useCallback(async () => {
    try {
      setError("")

      if (createdAddress?.signature === addressSignature) {
        return createdAddress.id
      }

      if (!values.street.trim()) {
        throw new Error("La rue ou avenue est obligatoire.")
      }

      const response = await apiPostJson<AddressCreateResponse>(
        "/api/localisation/addresses/",
        {
          administrative_area: requiredNumericValue(
            values.administrative_area,
            "La division administrative"
          ),
          country: requiredNumericValue(values.country, "Le pays"),
          locality: requiredNumericValue(values.locality, "La localite"),
          postal_code: values.postal_code.trim(),
          street: values.street.trim(),
          sub_locality: requiredNumericValue(
            values.sub_locality,
            "La sous-localite"
          ),
        }
      )

      const addressId = createdAddressId(response)

      setCreatedAddress({ id: addressId, signature: addressSignature })

      return addressId
    } catch (caughtError) {
      const message = toErrorMessage(
        caughtError,
        "Creation de l'adresse impossible."
      )

      setError(message)
      throw new Error(message)
    }
  }, [
    addressSignature,
    createdAddress,
    values.administrative_area,
    values.country,
    values.locality,
    values.postal_code,
    values.street,
    values.sub_locality,
  ])

  useImperativeHandle(
    ref,
    () => ({
      createAddress,
    }),
    [createAddress]
  )

  const selectDisabled = disabled || loadingCountries

  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm",
        className
      )}
    >
      <div className="mb-5 flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <MapPin className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      {error ? (
        <p
          aria-live="polite"
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <AddressSelectField
          id={`${idPrefix}-country`}
          label="Pays *"
          name="country"
          value={values.country}
          options={countryOptions}
          loading={loadingCountries}
          disabled={disabled}
          required
          onChange={updateValue}
          placeholder="Selectionner un pays"
        />
        <AddressSelectField
          id={`${idPrefix}-administrative-area`}
          label="Division administrative *"
          name="administrative_area"
          value={values.administrative_area}
          options={administrativeAreaOptions}
          loading={loadingAdministrativeAreas}
          disabled={selectDisabled || !values.country}
          required
          onChange={updateValue}
          placeholder={
            values.country ? "Selectionner une division" : "Choisir un pays"
          }
        />
        <AddressSelectField
          id={`${idPrefix}-locality`}
          label="Localite *"
          name="locality"
          value={values.locality}
          options={localityOptions}
          loading={loadingLocalities}
          disabled={
            selectDisabled || !values.country || !values.administrative_area
          }
          required
          onChange={updateValue}
          placeholder={
            values.administrative_area
              ? "Selectionner une localite"
              : "Choisir une division"
          }
        />
        <AddressSelectField
          id={`${idPrefix}-sub-locality`}
          label="Sous-localite *"
          name="sub_locality"
          value={values.sub_locality}
          options={subLocalityOptions}
          loading={loadingSubLocalities}
          disabled={
            selectDisabled ||
            !values.country ||
            !values.administrative_area ||
            !values.locality
          }
          required
          onChange={updateValue}
          placeholder={
            values.locality
              ? "Selectionner une sous-localite"
              : "Choisir une localite"
          }
        />
        <AddressTextField
          id={`${idPrefix}-street`}
          label="Rue / avenue *"
          name="street"
          value={values.street}
          disabled={disabled}
          required
          onChange={updateValue}
          placeholder="Avenue de la Justice 10"
        />
        <AddressTextField
          id={`${idPrefix}-postal-code`}
          label="Code postal"
          name="postal_code"
          value={values.postal_code}
          disabled={disabled}
          inputMode="numeric"
          onChange={updateValue}
          placeholder="0000"
        />
      </div>
    </section>
  )
})

AddressCreateSection.displayName = "AddressCreateSection"

export {
  AddressCreateSection,
  emptyAddressSummary,
  type AddressCreateSectionHandle,
  type AddressSummary,
}

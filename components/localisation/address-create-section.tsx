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
import { Check, ChevronsUpDown, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { useAddressFieldMetadata } from "@/components/localisation/use-address-field-metadata"
import { ApiError, apiFetch, apiPostJson } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

type AddressFormValues = {
  administrative_area: string
  city: string
  complement_adresse: string
  country: string
  formatted_address: string
  latitude: string
  locality: string
  longitude: string
  neighborhood: string
  postal_code: string
  proximite_transports: string
  state: string
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
  city: "",
  complement_adresse: "",
  country: "",
  formatted_address: "",
  latitude: "",
  locality: "",
  longitude: "",
  neighborhood: "",
  postal_code: "",
  proximite_transports: "",
  state: "",
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

function countryFlagClassName(iso2?: string) {
  return iso2 ? `fi fi-${iso2.toLowerCase()}` : ""
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

function optionalNumericValue(value: string, label: string) {
  const nextValue = value.trim()

  if (!nextValue) {
    return undefined
  }

  if (!/^\d+$/.test(nextValue)) {
    throw new Error(`${label} est invalide.`)
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

  throw new Error("L'adresse créée ne contient pas d'identifiant.")
}

function FieldHelpText({
  description,
  id,
}: {
  description?: string
  id: string
}) {
  return description ? (
    <p id={`${id}-help`} className="text-xs leading-5 text-muted-foreground">
      {description}
    </p>
  ) : null
}

function AddressTextField({
  description,
  disabled,
  id,
  inputMode,
  label,
  maxLength,
  name,
  onChange,
  placeholder,
  required,
  value,
}: {
  description?: string
  disabled?: boolean
  id: string
  inputMode?: "decimal" | "numeric" | "text"
  label: string
  maxLength?: number
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
        aria-describedby={description ? `${id}-help` : undefined}
        className={inputClassName}
        id={id}
        name={name}
        type="text"
        value={value}
        disabled={disabled}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(name, event.target.value)}
      />
      <FieldHelpText description={description} id={id} />
    </div>
  )
}

function CountryComboboxField({
  countries,
  description,
  disabled,
  id,
  label,
  loading,
  onChange,
  placeholder,
  required,
  value,
}: {
  countries: CountryOption[]
  description?: string
  disabled?: boolean
  id: string
  label: string
  loading?: boolean
  onChange: (name: keyof AddressFormValues, value: string) => void
  placeholder: string
  required?: boolean
  value: string
}) {
  const [open, setOpen] = useState(false)
  const selectedCountry = optionById(countries, value)

  return (
    <div className="space-y-2">
      <label className={labelClassName} htmlFor={id}>
        {label}
      </label>
      {loading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              aria-describedby={description ? `${id}-help` : undefined}
              id={id}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-required={required}
              disabled={disabled}
              className="h-10 w-full justify-between rounded-md px-3 font-normal"
            >
              {selectedCountry ? (
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "h-3.5 w-5 shrink-0 rounded-[2px] bg-muted",
                      countryFlagClassName(selectedCountry.iso2)
                    )}
                  />
                  <span className="truncate">{selectedCountry.name}</span>
                  {selectedCountry.iso2 ? (
                    <span className="text-muted-foreground">
                      {selectedCountry.iso2}
                    </span>
                  ) : null}
                </span>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-(--radix-popover-trigger-width) p-0"
          >
            <Command>
              <CommandInput placeholder="Rechercher un pays..." />
              <CommandList>
                <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                <CommandGroup>
                  {countries.map((country) => {
                    const countryId = String(country.id)
                    const selected = countryId === value

                    return (
                      <CommandItem
                        key={country.id}
                        value={`${country.name} ${country.iso2 ?? ""} ${
                          country.phone_code ?? ""
                        }`}
                        onSelect={() => {
                          onChange("country", countryId)
                          setOpen(false)
                        }}
                      >
                        <span
                          className={cn(
                            "h-3.5 w-5 shrink-0 rounded-[2px] bg-muted",
                            countryFlagClassName(country.iso2)
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {country.name}
                        </span>
                        {country.phone_code ? (
                          <span className="text-xs text-muted-foreground">
                            {country.phone_code}
                          </span>
                        ) : null}
                        <Check
                          className={cn(
                            "size-4 shrink-0",
                            selected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
      <FieldHelpText description={description} id={id} />
    </div>
  )
}

function AddressComboboxField({
  description,
  disabled,
  emptyLabel = "Aucun résultat trouvé.",
  id,
  label,
  loading,
  name,
  onChange,
  options,
  placeholder,
  required,
  searchPlaceholder = "Rechercher...",
  value,
}: {
  description?: string
  disabled?: boolean
  emptyLabel?: string
  id: string
  label: string
  loading?: boolean
  name: keyof AddressFormValues
  onChange: (name: keyof AddressFormValues, value: string) => void
  options: Array<{ label: string; meta?: string; value: string }>
  placeholder: string
  required?: boolean
  searchPlaceholder?: string
  value: string
}) {
  const [open, setOpen] = useState(false)
  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className="space-y-2">
      <label className={labelClassName} htmlFor={id}>
        {label}
      </label>
      {loading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              aria-describedby={description ? `${id}-help` : undefined}
              id={id}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-required={required}
              disabled={disabled}
              className="h-10 w-full justify-between rounded-md px-3 font-normal"
            >
              {selectedOption ? (
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate">{selectedOption.label}</span>
                  {selectedOption.meta ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {selectedOption.meta}
                    </span>
                  ) : null}
                </span>
              ) : (
                <span className="truncate text-muted-foreground">
                  {placeholder}
                </span>
              )}
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-(--radix-popover-trigger-width) p-0"
          >
            <Command>
              <CommandInput placeholder={searchPlaceholder} />
              <CommandList>
                <CommandEmpty>{emptyLabel}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => {
                    const selected = option.value === value

                    return (
                      <CommandItem
                        key={option.value}
                        value={`${option.label} ${option.meta ?? ""}`}
                        onSelect={() => {
                          onChange(name, option.value)
                          setOpen(false)
                        }}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {option.label}
                        </span>
                        {option.meta ? (
                          <span className="text-xs text-muted-foreground">
                            {option.meta}
                          </span>
                        ) : null}
                        <Check
                          className={cn(
                            "size-4 shrink-0",
                            selected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
      <FieldHelpText description={description} id={id} />
    </div>
  )
}

const AddressCreateSection = forwardRef<
  AddressCreateSectionHandle,
  AddressCreateSectionProps
>(function AddressCreateSection(
  {
    className,
    description = "Créez l'adresse à associer au dossier.",
    disabled = false,
    onSummaryChange,
    title = "Adresse",
  },
  ref
) {
  const idPrefix = useId()
  const addressFields = useAddressFieldMetadata("LocalisationAddressRequest")
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
      administrativeArea:
        selectedName(administrativeAreas, values.administrative_area) ||
        values.state.trim(),
      country: selectedName(countries, values.country),
      locality: selectedName(localities, values.locality) || values.city.trim(),
      postalCode: values.postal_code.trim(),
      street: values.street.trim(),
      subLocality:
        selectedName(subLocalities, values.sub_locality) ||
        values.neighborhood.trim(),
    }),
    [
      values.administrative_area,
      values.city,
      values.country,
      values.locality,
      values.neighborhood,
      values.postal_code,
      values.state,
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
        city: values.city.trim(),
        complement_adresse: values.complement_adresse.trim(),
        country: values.country,
        formatted_address: values.formatted_address.trim(),
        latitude: values.latitude.trim(),
        locality: values.locality,
        longitude: values.longitude.trim(),
        neighborhood: values.neighborhood.trim(),
        postal_code: values.postal_code.trim(),
        proximite_transports: values.proximite_transports.trim(),
        state: values.state.trim(),
        street: values.street.trim(),
        sub_locality: values.sub_locality,
      }),
    [
      values.administrative_area,
      values.city,
      values.complement_adresse,
      values.country,
      values.formatted_address,
      values.latitude,
      values.locality,
      values.longitude,
      values.neighborhood,
      values.postal_code,
      values.proximite_transports,
      values.state,
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
            toErrorMessage(caughtError, "Impossible de charger les localités.")
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
            toErrorMessage(caughtError, "Impossible de charger les quartiers.")
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
          administrative_area: optionalNumericValue(
            values.administrative_area,
            "La division administrative"
          ),
          city: values.city.trim(),
          complement_adresse: values.complement_adresse.trim(),
          country: requiredNumericValue(values.country, "Le pays"),
          formatted_address: values.formatted_address.trim(),
          latitude: values.latitude.trim(),
          locality: optionalNumericValue(values.locality, "La localité"),
          longitude: values.longitude.trim(),
          neighborhood: values.neighborhood.trim(),
          postal_code: values.postal_code.trim(),
          proximite_transports: values.proximite_transports.trim(),
          state: values.state.trim(),
          street: values.street.trim(),
          sub_locality: optionalNumericValue(
            values.sub_locality,
            "Le quartier"
          ),
        }
      )

      const addressId = createdAddressId(response)

      setCreatedAddress({ id: addressId, signature: addressSignature })

      return addressId
    } catch (caughtError) {
      const message = toErrorMessage(
        caughtError,
        "Création de l'adresse impossible."
      )

      setError(message)
      throw new Error(message)
    }
  }, [
    addressSignature,
    createdAddress,
    values.administrative_area,
    values.city,
    values.complement_adresse,
    values.country,
    values.formatted_address,
    values.latitude,
    values.locality,
    values.longitude,
    values.neighborhood,
    values.postal_code,
    values.proximite_transports,
    values.state,
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
        <CountryComboboxField
          description={addressFields.country.description}
          id={`${idPrefix}-country`}
          label={`${addressFields.country.title} *`}
          value={values.country}
          countries={countries}
          loading={loadingCountries}
          disabled={disabled}
          required
          onChange={updateValue}
          placeholder="Sélectionner un pays"
        />
        <AddressComboboxField
          description={addressFields.administrative_area.description}
          id={`${idPrefix}-administrative-area`}
          label={addressFields.administrative_area.title}
          name="administrative_area"
          value={values.administrative_area}
          options={administrativeAreaOptions}
          loading={loadingAdministrativeAreas}
          disabled={selectDisabled || !values.country}
          onChange={updateValue}
          placeholder={
            values.country ? "Sélectionner une division" : "Choisir un pays"
          }
          searchPlaceholder="Rechercher une division..."
          emptyLabel="Aucune division trouvée."
        />
        <AddressTextField
          description={addressFields.state.description}
          id={`${idPrefix}-state`}
          label={addressFields.state.title}
          maxLength={addressFields.state.maxLength}
          name="state"
          value={values.state}
          disabled={disabled}
          onChange={updateValue}
          placeholder="Kinshasa"
        />
        <AddressComboboxField
          description={addressFields.locality.description}
          id={`${idPrefix}-locality`}
          label={addressFields.locality.title}
          name="locality"
          value={values.locality}
          options={localityOptions}
          loading={loadingLocalities}
          disabled={
            selectDisabled || !values.country || !values.administrative_area
          }
          onChange={updateValue}
          placeholder={
            values.administrative_area
              ? "Sélectionner une localité"
              : "Choisir une division"
          }
          searchPlaceholder="Rechercher une localité..."
          emptyLabel="Aucune localité trouvée."
        />
        <AddressTextField
          description={addressFields.city.description}
          id={`${idPrefix}-city`}
          label={addressFields.city.title}
          maxLength={addressFields.city.maxLength}
          name="city"
          value={values.city}
          disabled={disabled}
          onChange={updateValue}
          placeholder="Gombe"
        />
        <AddressComboboxField
          description={addressFields.sub_locality.description}
          id={`${idPrefix}-sub-locality`}
          label={addressFields.sub_locality.title}
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
          onChange={updateValue}
          placeholder={
            values.locality
              ? "Sélectionner un quartier"
              : "Choisir une localité"
          }
          searchPlaceholder="Rechercher un quartier..."
          emptyLabel="Aucun quartier trouvé."
        />
        <AddressTextField
          description={addressFields.neighborhood.description}
          id={`${idPrefix}-neighborhood`}
          label={addressFields.neighborhood.title}
          maxLength={addressFields.neighborhood.maxLength}
          name="neighborhood"
          value={values.neighborhood}
          disabled={disabled}
          onChange={updateValue}
          placeholder="Quartier des affaires"
        />
        <AddressTextField
          description={addressFields.street.description}
          id={`${idPrefix}-street`}
          label={`${addressFields.street.title} *`}
          maxLength={addressFields.street.maxLength}
          name="street"
          value={values.street}
          disabled={disabled}
          required
          onChange={updateValue}
          placeholder="Avenue de la Justice 10"
        />
        <AddressTextField
          description={addressFields.complement_adresse.description}
          id={`${idPrefix}-complement`}
          label={addressFields.complement_adresse.title}
          maxLength={addressFields.complement_adresse.maxLength}
          name="complement_adresse"
          value={values.complement_adresse}
          disabled={disabled}
          onChange={updateValue}
          placeholder="Immeuble Homelink, 2e étage"
        />
        <AddressTextField
          description={addressFields.postal_code.description}
          id={`${idPrefix}-postal-code`}
          label={addressFields.postal_code.title}
          maxLength={addressFields.postal_code.maxLength}
          name="postal_code"
          value={values.postal_code}
          disabled={disabled}
          inputMode="numeric"
          onChange={updateValue}
          placeholder="0000"
        />
        <AddressTextField
          description={addressFields.proximite_transports.description}
          id={`${idPrefix}-transports`}
          label={addressFields.proximite_transports.title}
          name="proximite_transports"
          value={values.proximite_transports}
          disabled={disabled}
          onChange={updateValue}
          placeholder="À proximité de la Gare Centrale"
        />
        <AddressTextField
          description={addressFields.formatted_address.description}
          id={`${idPrefix}-formatted-address`}
          label={addressFields.formatted_address.title}
          maxLength={addressFields.formatted_address.maxLength}
          name="formatted_address"
          value={values.formatted_address}
          disabled={disabled}
          onChange={updateValue}
          placeholder="Avenue de la Justice 10, Gombe, Kinshasa"
        />
        <AddressTextField
          description={addressFields.latitude.description}
          id={`${idPrefix}-latitude`}
          label={addressFields.latitude.title}
          name="latitude"
          value={values.latitude}
          disabled={disabled}
          inputMode="decimal"
          onChange={updateValue}
          placeholder="-4.325000"
        />
        <AddressTextField
          description={addressFields.longitude.description}
          id={`${idPrefix}-longitude`}
          label={addressFields.longitude.title}
          name="longitude"
          value={values.longitude}
          disabled={disabled}
          inputMode="decimal"
          onChange={updateValue}
          placeholder="15.322200"
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

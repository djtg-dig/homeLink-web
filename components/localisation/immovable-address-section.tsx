"use client"

import {
  forwardRef,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

type ImmovableAddressValues = {
  administrative_area: string
  complement_adresse: string
  country: string
  formatted_address: string
  latitude: string
  locality: string
  longitude: string
  postal_code: string
  proximite_transports: string
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

type ImmovableAddressPayload = {
  administrative_area: number
  city: string
  complement_adresse: string
  country_id: number
  formatted_address: string
  latitude: string
  locality: number
  longitude: string
  neighborhood: string
  postal_code: string
  proximite_transports: string
  state: string
  street: string
  sub_locality: number
}

type ImmovableAddressSummary = {
  administrativeArea: string
  country: string
  formattedAddress: string
  locality: string
  street: string
  subLocality: string
}

type ImmovableAddressSectionHandle = {
  getAddressPayload: () => ImmovableAddressPayload
}

type ImmovableAddressSectionProps = {
  className?: string
  description?: string
  disabled?: boolean
  onSummaryChange?: (summary: ImmovableAddressSummary) => void
  title?: string
}

const initialValues: ImmovableAddressValues = {
  administrative_area: "",
  complement_adresse: "",
  country: "",
  formatted_address: "",
  latitude: "",
  locality: "",
  longitude: "",
  postal_code: "",
  proximite_transports: "",
  street: "",
  sub_locality: "",
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

function formattedAddress({
  administrativeArea,
  country,
  locality,
  street,
  subLocality,
}: ImmovableAddressSummary) {
  return [street, subLocality, locality, administrativeArea, country]
    .filter(Boolean)
    .join(", ")
}

function TextField({
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
  inputMode?: "decimal" | "text"
  label: string
  name: keyof ImmovableAddressValues
  onChange: (name: keyof ImmovableAddressValues, value: string) => void
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

function CountryCombobox({
  countries,
  disabled,
  id,
  loading,
  onChange,
  value,
}: {
  countries: CountryOption[]
  disabled?: boolean
  id: string
  loading?: boolean
  onChange: (name: keyof ImmovableAddressValues, value: string) => void
  value: string
}) {
  const [open, setOpen] = useState(false)
  const selectedCountry = optionById(countries, value)

  return (
    <div className="space-y-2">
      <label className={labelClassName} htmlFor={id}>
        Pays *
      </label>
      {loading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-required
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
                <span className="text-muted-foreground">
                  Sélectionner un pays
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
    </div>
  )
}

function SelectField({
  disabled,
  id,
  label,
  loading,
  name,
  onChange,
  options,
  placeholder,
  value,
}: {
  disabled?: boolean
  id: string
  label: string
  loading?: boolean
  name: keyof ImmovableAddressValues
  onChange: (name: keyof ImmovableAddressValues, value: string) => void
  options: Array<{ label: string; meta?: string; value: string }>
  placeholder: string
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
        <Select
          value={value}
          disabled={disabled}
          onValueChange={(nextValue) => onChange(name, nextValue)}
        >
          <SelectTrigger id={id} className="h-10 w-full rounded-md">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="min-w-0 truncate">{option.label}</span>
                {option.meta ? (
                  <span className="text-xs text-muted-foreground">
                    {option.meta}
                  </span>
                ) : null}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

const ImmovableAddressSection = forwardRef<
  ImmovableAddressSectionHandle,
  ImmovableAddressSectionProps
>(function ImmovableAddressSection(
  {
    className,
    description = "Adresse associée au bien.",
    disabled = false,
    onSummaryChange,
    title = "Adresse",
  },
  ref
) {
  const idPrefix = useId()
  const [values, setValues] = useState<ImmovableAddressValues>(initialValues)
  const [error, setError] = useState("")
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

  const summary = useMemo<ImmovableAddressSummary>(
    () => ({
      administrativeArea: selectedName(
        administrativeAreas,
        values.administrative_area
      ),
      country: selectedName(countries, values.country),
      formattedAddress: values.formatted_address.trim(),
      locality: selectedName(localities, values.locality),
      street: values.street.trim(),
      subLocality: selectedName(subLocalities, values.sub_locality),
    }),
    [
      values.administrative_area,
      values.country,
      values.formatted_address,
      values.locality,
      values.street,
      values.sub_locality,
      administrativeAreas,
      countries,
      localities,
      subLocalities,
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
  }, [values.country, values.administrative_area])

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
              "Impossible de charger les sous-localités."
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
  }, [values.country, values.administrative_area, values.locality])

  function updateValue(name: keyof ImmovableAddressValues, value: string) {
    setError("")

    if (name === "country") {
      setAdministrativeAreas([])
      setLocalities([])
      setSubLocalities([])
      setLoadingAdministrativeAreas(Boolean(value))
    }

    if (name === "administrative_area") {
      setLocalities([])
      setSubLocalities([])
      setLoadingLocalities(Boolean(value))
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

  useImperativeHandle(
    ref,
    () => ({
      getAddressPayload() {
        const countryId = requiredNumericValue(values.country, "Le pays")
        const administrativeAreaId = requiredNumericValue(
          values.administrative_area,
          "La division administrative"
        )
        const localityId = requiredNumericValue(values.locality, "La localité")
        const subLocalityId = requiredNumericValue(
          values.sub_locality,
          "La sous-localité"
        )
        const street = values.street.trim()

        if (!street) {
          throw new Error("La rue est obligatoire.")
        }

        const fallbackFormattedAddress = formattedAddress(summary)

        return {
          administrative_area: administrativeAreaId,
          city: summary.locality,
          complement_adresse: values.complement_adresse.trim(),
          country_id: countryId,
          formatted_address:
            values.formatted_address.trim() || fallbackFormattedAddress,
          latitude: values.latitude.trim(),
          locality: localityId,
          longitude: values.longitude.trim(),
          neighborhood: summary.subLocality,
          postal_code: values.postal_code.trim(),
          proximite_transports: values.proximite_transports.trim(),
          state: summary.administrativeArea,
          street,
          sub_locality: subLocalityId,
        }
      },
    }),
    [summary, values]
  )

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
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <CountryCombobox
          countries={countries}
          disabled={disabled}
          id={`${idPrefix}-country`}
          loading={loadingCountries}
          value={values.country}
          onChange={updateValue}
        />
        <SelectField
          id={`${idPrefix}-administrative-area`}
          label="Division administrative *"
          name="administrative_area"
          value={values.administrative_area}
          options={administrativeAreaOptions}
          placeholder="Sélectionner"
          disabled={disabled || !values.country}
          loading={loadingAdministrativeAreas}
          onChange={updateValue}
        />
        <SelectField
          id={`${idPrefix}-locality`}
          label="Localité *"
          name="locality"
          value={values.locality}
          options={localityOptions}
          placeholder="Sélectionner"
          disabled={disabled || !values.administrative_area}
          loading={loadingLocalities}
          onChange={updateValue}
        />
        <SelectField
          id={`${idPrefix}-sub-locality`}
          label="Sous-localité *"
          name="sub_locality"
          value={values.sub_locality}
          options={subLocalityOptions}
          placeholder="Sélectionner"
          disabled={disabled || !values.locality}
          loading={loadingSubLocalities}
          onChange={updateValue}
        />
        <TextField
          id={`${idPrefix}-street`}
          label="Rue *"
          name="street"
          value={values.street}
          required
          disabled={disabled}
          placeholder="Avenue de la Justice 10"
          onChange={updateValue}
        />
        <TextField
          id={`${idPrefix}-postal-code`}
          label="Code postal"
          name="postal_code"
          value={values.postal_code}
          disabled={disabled}
          placeholder="0000"
          onChange={updateValue}
        />
        <TextField
          id={`${idPrefix}-complement`}
          label="Complément d'adresse"
          name="complement_adresse"
          value={values.complement_adresse}
          disabled={disabled}
          onChange={updateValue}
        />
        <TextField
          id={`${idPrefix}-transports`}
          label="Proximité transports"
          name="proximite_transports"
          value={values.proximite_transports}
          disabled={disabled}
          onChange={updateValue}
        />
        <TextField
          id={`${idPrefix}-latitude`}
          label="Latitude"
          name="latitude"
          value={values.latitude}
          inputMode="decimal"
          disabled={disabled}
          onChange={updateValue}
        />
        <TextField
          id={`${idPrefix}-longitude`}
          label="Longitude"
          name="longitude"
          value={values.longitude}
          inputMode="decimal"
          disabled={disabled}
          onChange={updateValue}
        />
        <div className="md:col-span-2">
          <TextField
            id={`${idPrefix}-formatted-address`}
            label="Adresse affichée"
            name="formatted_address"
            value={values.formatted_address}
            disabled={disabled}
            placeholder={formattedAddress(summary) || "Adresse complète"}
            onChange={updateValue}
          />
        </div>
      </div>
    </section>
  )
})

export {
  ImmovableAddressSection,
  type ImmovableAddressPayload,
  type ImmovableAddressSectionHandle,
  type ImmovableAddressSummary,
}

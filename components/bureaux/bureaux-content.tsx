"use client"

import * as React from "react"
import Link from "next/link"
import {
  BriefcaseBusiness,
  CheckCircle2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
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
import {
  agencyName,
  bureauAddressLabel,
  bureauDisplayName,
  bureauId,
  bureauReferenceLabel,
  conditionLabel,
  createdDateLabel,
  officeTypeLabel,
  parseBureaux,
  priceLabel,
  statusLabel,
  surfaceLabel,
  transactionLabel,
  type Bureau,
  type BureauxResponse,
} from "@/lib/bureaux"
import { ApiError, apiFetch, jsonHeaders } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

const NO_AGENCY_VALUE = "__none__"

type BureauEditValues = {
  agency_id: string
  alarm: boolean
  area: string
  available_from: string
  charges: string
  condition: string
  description: string
  digicode: boolean
  est_proprietaire: boolean
  floor_number: string
  furniture_included: boolean
  has_private_entrance: boolean
  has_wifi: boolean
  interphone: boolean
  is_active: boolean
  is_available: boolean
  lease_type: string
  max_capacity: string
  monthly_rent: string
  office_type: string
  prix_location_mensuel: string
  prix_vente: string
  private_offices_count: string
  statut: string
  surface_habitable: string
  surface_totale: string
  title: string
  type_transaction: string
  watch_camera: boolean
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

const toggleFields: Array<{ label: string; name: keyof BureauEditValues }> = [
  { label: "Alarme", name: "alarm" },
  { label: "Caméras", name: "watch_camera" },
  { label: "Digicode", name: "digicode" },
  { label: "Interphone", name: "interphone" },
  { label: "Entrée privée", name: "has_private_entrance" },
  { label: "Wi-Fi", name: "has_wifi" },
  { label: "Mobilier inclus", name: "furniture_included" },
  { label: "Disponible", name: "is_available" },
]

const inputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
const textAreaClassName =
  "min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
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

function valueText(value: unknown) {
  return value === undefined || value === null ? "" : String(value)
}

function formValuesFromBureau(bureau: Bureau): BureauEditValues {
  const details = bureau.bureau

  return {
    agency_id: bureau.agency?.id ? String(bureau.agency.id) : NO_AGENCY_VALUE,
    alarm: Boolean(details?.alarm),
    area: valueText(details?.area),
    available_from: valueText(details?.available_from),
    charges: valueText(details?.charges),
    condition: details?.condition?.trim() || "neuf",
    description: bureau.description?.trim() ?? "",
    digicode: Boolean(details?.digicode),
    est_proprietaire: bureau.est_proprietaire !== false,
    floor_number: valueText(details?.floor_number),
    furniture_included: Boolean(details?.furniture_included),
    has_private_entrance: Boolean(details?.has_private_entrance),
    has_wifi: details?.has_wifi !== false,
    interphone: Boolean(details?.interphone),
    is_active: bureau.is_active !== false,
    is_available: details?.is_available !== false,
    lease_type: details?.lease_type?.trim() || "meuble",
    max_capacity: valueText(details?.max_capacity),
    monthly_rent: valueText(details?.monthly_rent),
    office_type: details?.office_type?.trim() || "open_space",
    prix_location_mensuel: valueText(bureau.prix_location_mensuel),
    prix_vente: valueText(bureau.prix_vente),
    private_offices_count: valueText(details?.private_offices_count),
    statut: bureau.statut?.trim() || "disponible",
    surface_habitable: valueText(bureau.surface_habitable),
    surface_totale: valueText(bureau.surface_totale),
    title: bureau.title?.trim() ?? "",
    type_transaction: bureau.type_transaction?.trim() || "vente",
    watch_camera: Boolean(details?.watch_camera),
  }
}

function buildPatchPayload(values: BureauEditValues) {
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
    has_private_entrance: values.has_private_entrance,
    has_wifi: values.has_wifi,
    interphone: values.interphone,
    is_available: values.is_available,
    lease_type: values.lease_type,
    office_type: values.office_type,
    watch_camera: values.watch_camera,
  }
  const textFields: Array<keyof BureauEditValues> = [
    "area",
    "monthly_rent",
    "charges",
    "available_from",
  ]

  textFields.forEach((field) => {
    const value = optionalText(values[field] as string)

    if (value !== undefined) {
      bureau[field] = value
    }
  })

  const integerFields: Array<keyof BureauEditValues> = [
    "floor_number",
    "private_offices_count",
    "max_capacity",
  ]

  integerFields.forEach((field) => {
    const value = optionalInteger(values[field] as string, String(field))

    if (value !== undefined) {
      bureau[field] = value
    }
  })

  return {
    agency_id: values.agency_id === NO_AGENCY_VALUE ? null : values.agency_id,
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
    surface_habitable: requiredText(
      values.surface_habitable,
      "La surface habitable"
    ),
    surface_totale: requiredText(values.surface_totale, "La surface totale"),
    title: requiredText(values.title, "Le titre"),
    type_transaction: values.type_transaction,
  }
}

function BureauxTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="border-b border-border last:border-b-0">
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-4 w-52" />
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-6 w-24" />
          </td>
          <td className="px-4 py-4 text-right">
            <Skeleton className="ml-auto h-7 w-48" />
          </td>
        </tr>
      ))}
    </>
  )
}

function StatusPill({
  active,
  children,
}: {
  active: boolean
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        active
          ? "bg-secondary text-secondary-foreground"
          : "bg-muted text-muted-foreground"
      )}
    >
      {children}
    </span>
  )
}

function TextField({
  inputMode,
  label,
  name,
  onChange,
  required,
  type = "text",
  value,
}: {
  inputMode?: "decimal" | "numeric" | "text"
  label: string
  name: keyof BureauEditValues
  onChange: (name: keyof BureauEditValues, value: string) => void
  required?: boolean
  type?: string
  value: string
}) {
  return (
    <div className="space-y-2">
      <label className={labelClassName} htmlFor={`edit-${name}`}>
        {label}
      </label>
      <input
        className={inputClassName}
        id={`edit-${name}`}
        name={name}
        type={type}
        value={value}
        inputMode={inputMode}
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
  name: keyof BureauEditValues
  onChange: (name: keyof BureauEditValues, value: string) => void
  options: Array<{ label: string; value: string }>
  value: string
}) {
  return (
    <div className="space-y-2">
      <label className={labelClassName} htmlFor={`edit-${name}`}>
        {label}
      </label>
      <Select
        value={value}
        onValueChange={(nextValue) => onChange(name, nextValue)}
      >
        <SelectTrigger id={`edit-${name}`} className="h-10 w-full rounded-md">
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

function BureauEditDialog({
  agencies,
  bureau,
  onClose,
  onUpdated,
}: {
  agencies: Agency[]
  bureau: Bureau
  onClose: () => void
  onUpdated: (bureau: Bureau) => void
}) {
  const [values, setValues] = React.useState<BureauEditValues>(() =>
    formValuesFromBureau(bureau)
  )
  const [error, setError] = React.useState("")
  const [pending, setPending] = React.useState(false)

  function updateValue(name: keyof BureauEditValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function updateBoolean(name: keyof BureauEditValues, checked: boolean) {
    setValues((current) => ({ ...current, [name]: checked }))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const id = bureauId(bureau)

    if (!id) {
      setError("Ce bureau ne contient pas d'identifiant.")
      return
    }

    setPending(true)

    try {
      const payload = buildPatchPayload(values)
      const updatedBureau = await apiFetch<Partial<Bureau> | undefined>(
        `/api/immovables/bureaux/${encodeURIComponent(id)}/`,
        {
          body: JSON.stringify(payload),
          headers: jsonHeaders(),
          method: "PATCH",
        }
      )

      onUpdated({
        ...bureau,
        ...payload,
        ...(updatedBureau ?? {}),
      })
      toast({
        description: "Les informations du bureau ont été mises à jour.",
        title: "Bureau modifié",
        variant: "success",
      })
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(formatApiMessage(caughtError.body, "Modification impossible."))
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Modification impossible."
        )
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-brand-navy/55 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-bureau-title"
    >
      <form
        className="max-h-[92svh] w-full overflow-y-auto rounded-t-lg border border-border bg-card text-card-foreground shadow-xl sm:max-w-4xl sm:rounded-lg"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              Modification de bureau
            </p>
            <h2
              id="edit-bureau-title"
              className="mt-1 truncate text-xl font-semibold"
            >
              {bureauDisplayName(bureau)}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        <div className="space-y-5 p-4">
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Titre *"
              name="title"
              value={values.title}
              required
              onChange={updateValue}
            />
            <div className="space-y-2">
              <label className={labelClassName} htmlFor="edit-agency_id">
                Agence
              </label>
              <Select
                value={values.agency_id}
                onValueChange={(nextValue) =>
                  updateValue("agency_id", nextValue)
                }
              >
                <SelectTrigger id="edit-agency_id" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_AGENCY_VALUE}>Sans agence</SelectItem>
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
            />
            <TextField
              label="Surface habitable *"
              name="surface_habitable"
              value={values.surface_habitable}
              inputMode="decimal"
              required
              onChange={updateValue}
            />
            <TextField
              label="Prix de vente"
              name="prix_vente"
              value={values.prix_vente}
              inputMode="decimal"
              onChange={updateValue}
            />
            <TextField
              label="Loyer mensuel"
              name="prix_location_mensuel"
              value={values.prix_location_mensuel}
              inputMode="decimal"
              onChange={updateValue}
            />
            <div className="space-y-2 md:col-span-2">
              <label className={labelClassName} htmlFor="edit-description">
                Description
              </label>
              <textarea
                className={textAreaClassName}
                id="edit-description"
                name="description"
                value={values.description}
                onChange={(event) =>
                  updateValue("description", event.target.value)
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label="Type"
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
            />
            <TextField
              label="Étage"
              name="floor_number"
              value={values.floor_number}
              inputMode="numeric"
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
              label="Capacité max"
              name="max_capacity"
              value={values.max_capacity}
              inputMode="numeric"
              onChange={updateValue}
            />
            <TextField
              label="Disponible le"
              name="available_from"
              value={values.available_from}
              type="date"
              onChange={updateValue}
            />
            <TextField
              label="Loyer bureau"
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
            <SwitchField
              label="Bien actif"
              checked={values.is_active}
              onChange={(checked) => updateBoolean("is_active", checked)}
            />
            <SwitchField
              label="Propriétaire"
              checked={values.est_proprietaire}
              onChange={(checked) => updateBoolean("est_proprietaire", checked)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {toggleFields.map((field) => (
              <SwitchField
                key={field.name}
                label={field.label}
                checked={Boolean(values[field.name])}
                onChange={(checked) => updateBoolean(field.name, checked)}
              />
            ))}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              Enregistrer
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

function BureauxContent() {
  const [bureaux, setBureaux] = React.useState<Bureau[]>([])
  const [agencies, setAgencies] = React.useState<Agency[]>([])
  const [count, setCount] = React.useState(0)
  const [deleteError, setDeleteError] = React.useState("")
  const [deletePending, setDeletePending] = React.useState(false)
  const [deletingBureau, setDeletingBureau] = React.useState<Bureau | null>(
    null
  )
  const [editingBureau, setEditingBureau] = React.useState<Bureau | null>(null)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const availableCount = React.useMemo(
    () =>
      bureaux.filter((bureau) => bureau.bureau?.is_available !== false).length,
    [bureaux]
  )

  const activeCount = React.useMemo(
    () => bureaux.filter((bureau) => bureau.is_active !== false).length,
    [bureaux]
  )

  const loadBureaux = React.useCallback(async (signal?: AbortSignal) => {
    try {
      const [bureauxResponse, agenciesResponse] = await Promise.all([
        apiFetch<BureauxResponse>("/api/immovables/bureaux/", { signal }),
        apiFetch<AgenciesResponse>("/api/agencies/", { signal }),
      ])
      const parsedBureaux = parseBureaux(bureauxResponse)
      const parsedAgencies = parseAgencies(agenciesResponse)

      if (signal?.aborted) {
        return
      }

      setBureaux(parsedBureaux.bureaux)
      setCount(parsedBureaux.count)
      setAgencies(parsedAgencies.agencies)
      setError("")
    } catch (caughtError) {
      if (signal?.aborted) {
        return
      }

      if (caughtError instanceof ApiError) {
        setError(formatApiMessage(caughtError.body, "Chargement impossible."))
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Chargement impossible."
        )
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  React.useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadBureaux(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadBureaux])

  function reloadBureaux() {
    setLoading(true)
    setError("")
    void loadBureaux()
  }

  function updateBureau(updatedBureau: Bureau) {
    const updatedId = bureauId(updatedBureau)

    setBureaux((current) =>
      current.map((bureau) =>
        bureauId(bureau) === updatedId ? updatedBureau : bureau
      )
    )
    setEditingBureau(null)
  }

  function openDeleteDialog(bureau: Bureau) {
    setDeleteError("")
    setDeletingBureau(bureau)
  }

  async function deleteBureau() {
    if (!deletingBureau) {
      return
    }

    const id = bureauId(deletingBureau)

    if (!id) {
      setDeleteError("Ce bureau ne contient pas d'identifiant.")
      return
    }

    setDeletePending(true)
    setDeleteError("")

    try {
      await apiFetch<void>(
        `/api/immovables/bureaux/${encodeURIComponent(id)}/`,
        {
          method: "DELETE",
        }
      )

      setBureaux((current) =>
        current.filter((bureau) => bureauId(bureau) !== id)
      )
      setCount((current) => Math.max(0, current - 1))
      setDeletingBureau(null)
      toast({
        description: "Le bureau a été supprimé.",
        title: "Bureau supprimé",
        variant: "success",
      })
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setDeleteError(
          formatApiMessage(caughtError.body, "Suppression impossible.")
        )
      } else {
        setDeleteError(
          caughtError instanceof Error
            ? caughtError.message
            : "Suppression impossible."
        )
      }
    } finally {
      setDeletePending(false)
    }
  }

  return (
    <>
      <DashboardShell title="Bureaux" breadcrumbs={[{ label: "Bureaux" }]}>
        <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Gestion des bureaux
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                Bureaux professionnels
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Créez et administrez les bureaux à vendre ou à louer, avec ou
                sans rattachement à une agence.
              </p>
            </div>
            <Button asChild className="h-10 w-full lg:w-auto">
              <Link href="/dashboard/bureaux/new">
                <Plus />
                Créer un bureau
              </Link>
            </Button>
          </div>
        </section>

        <section
          aria-label="Indicateurs bureaux"
          className="grid gap-4 md:grid-cols-3"
        >
          <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
            <p className="text-sm text-muted-foreground">Total bureaux</p>
            {loading ? (
              <Skeleton className="mt-3 h-9 w-20" />
            ) : (
              <p className="mt-3 text-3xl font-semibold">{count}</p>
            )}
          </article>
          <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
            <p className="text-sm text-muted-foreground">Disponibles</p>
            {loading ? (
              <Skeleton className="mt-3 h-9 w-20" />
            ) : (
              <p className="mt-3 text-3xl font-semibold">{availableCount}</p>
            )}
          </article>
          <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
            <p className="text-sm text-muted-foreground">Actifs</p>
            {loading ? (
              <Skeleton className="mt-3 h-9 w-20" />
            ) : (
              <p className="mt-3 text-3xl font-semibold">{activeCount}</p>
            )}
          </article>
        </section>

        <section className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Liste des bureaux</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Consultez les bureaux créés depuis l’API Homelink.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={reloadBureaux}
              disabled={loading}
            >
              <RefreshCw className={cn(loading && "animate-spin")} />
              Actualiser
            </Button>
          </div>

          {error ? (
            <div className="m-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Bureau</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Prix</th>
                  <th className="px-4 py-3 font-medium">Adresse</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <BureauxTableSkeleton /> : null}

                {!loading && bureaux.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12">
                      <div className="mx-auto flex max-w-md flex-col items-center text-center">
                        <span className="flex size-12 items-center justify-center rounded-md bg-secondary text-primary">
                          <BriefcaseBusiness className="size-6" />
                        </span>
                        <h3 className="mt-4 text-base font-semibold">
                          Aucun bureau pour le moment
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Créez un bureau pour alimenter cette liste.
                        </p>
                        <Button asChild className="mt-4">
                          <Link href="/dashboard/bureaux/new">
                            <Plus />
                            Créer un bureau
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : null}

                {!loading
                  ? bureaux.map((bureau, index) => {
                      const id = bureauId(bureau)
                      const key = id || `${bureau.title}-${index}`

                      return (
                        <tr
                          key={key}
                          className="border-b border-border last:border-b-0"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                                <BriefcaseBusiness className="size-5" />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold">
                                  {bureauDisplayName(bureau)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {bureauReferenceLabel(bureau)} ·{" "}
                                  {createdDateLabel(bureau.created_at)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {officeTypeLabel(bureau.bureau?.office_type)}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {conditionLabel(bureau.bureau?.condition)} ·{" "}
                              {surfaceLabel(bureau.surface_habitable)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {agencyName(bureau)}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium">
                              {priceLabel(bureau)}
                            </span>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {transactionLabel(bureau.type_transaction)}
                            </p>
                          </td>
                          <td className="max-w-80 px-4 py-4 text-muted-foreground">
                            <span className="flex items-start gap-1.5">
                              <MapPin className="mt-0.5 size-3.5 shrink-0" />
                              <span className="line-clamp-2">
                                {bureauAddressLabel(bureau)}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <StatusPill
                                active={bureau.statut === "disponible"}
                              >
                                {statusLabel(bureau.statut)}
                              </StatusPill>
                              <StatusPill
                                active={bureau.bureau?.is_available !== false}
                              >
                                <CheckCircle2 className="mr-1 size-3" />
                                {bureau.bureau?.is_available === false
                                  ? "Occupé"
                                  : "Libre"}
                              </StatusPill>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!id}
                                onClick={() => setEditingBureau(bureau)}
                              >
                                <Pencil />
                                Modifier
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={!id}
                                onClick={() => openDeleteDialog(bureau)}
                              >
                                <Trash2 />
                                Supprimer
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  : null}
              </tbody>
            </table>
          </div>
        </section>
      </DashboardShell>

      {editingBureau ? (
        <BureauEditDialog
          agencies={agencies}
          bureau={editingBureau}
          onClose={() => setEditingBureau(null)}
          onUpdated={updateBureau}
        />
      ) : null}

      {deletingBureau ? (
        <DeleteConfirmDialog
          title="Supprimer le bureau"
          description={`Vous allez supprimer ${bureauDisplayName(
            deletingBureau
          )}. Cette action est définitive.`}
          error={deleteError}
          pending={deletePending}
          onClose={() => {
            if (!deletePending) {
              setDeletingBureau(null)
            }
          }}
          onConfirm={deleteBureau}
        />
      ) : null}
    </>
  )
}

export { BureauxContent }

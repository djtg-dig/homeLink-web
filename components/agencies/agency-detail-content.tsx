"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toaster"
import {
  agencyAddressLabel,
  agencyDisplayName,
  agencyOwnerName,
  agencySlug,
  formatDate,
  legalStatusLabel,
  statusLabel,
  verificationStatusLabel,
  yesNoLabel,
  type Agency,
} from "@/lib/agencies"
import { ApiError, apiFetch } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

type EditValues = {
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

const inputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
const textAreaClassName =
  "min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
const labelClassName = "text-sm font-medium text-foreground"

const legalStatusOptions = [
  { label: "Entreprise individuelle", value: "individual" },
  { label: "SARL", value: "sarl" },
  { label: "SA", value: "sa" },
  { label: "SAS", value: "sas" },
  { label: "ONG", value: "ong" },
  { label: "Autre", value: "other" },
]

function textValue(value?: string | null) {
  return value?.trim() ?? ""
}

function agencyToEditValues(agency: Agency): EditValues {
  return {
    description: textValue(agency.description),
    email: textValue(agency.email),
    is_active: agency.is_active !== false,
    legal_name: textValue(agency.legal_name),
    legal_status: textValue(agency.legal_status),
    name: textValue(agency.name),
    phone: textValue(agency.phone),
    rccm_number: textValue(agency.rccm_number),
    tax_number: textValue(agency.tax_number),
    website: textValue(agency.website),
  }
}

function appendEditValue(
  formData: FormData,
  key: keyof EditValues,
  value: string
) {
  formData.append(key, value.trim())
}

function Field({
  label,
  name,
  onChange,
  placeholder,
  required,
  type = "text",
  value,
}: {
  label: string
  name: keyof EditValues
  onChange: (name: keyof EditValues, value: string) => void
  placeholder?: string
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
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </div>
  )
}

function InfoCard({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode
  icon: typeof Building2
  title: string
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-primary">
          <Icon className="size-4" />
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0">
      <p className="text-xs font-medium text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-1 text-sm leading-6">{value || "-"}</div>
    </div>
  )
}

function StatusPill({
  children,
  muted,
}: {
  children: React.ReactNode
  muted?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        muted
          ? "bg-muted text-muted-foreground"
          : "bg-secondary text-secondary-foreground"
      )}
    >
      {children}
    </span>
  )
}

function MediaBlock({
  image,
  type,
}: {
  image?: string | null
  type: "cover" | "logo"
}) {
  const imageStyle = image
    ? {
        backgroundImage: `url(${image})`,
      }
    : undefined

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-secondary bg-cover bg-center text-primary",
        type === "cover"
          ? "h-40 sm:h-52"
          : "size-24 shrink-0 rounded-lg border border-border bg-card"
      )}
      style={imageStyle}
    >
      {image ? null : (
        <Building2 className={type === "cover" ? "size-12" : "size-9"} />
      )}
    </div>
  )
}

function DocumentLink({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0">
      <span className="text-sm">{label}</span>
      {value ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Ouvrir
          <ExternalLink className="size-3.5" />
        </a>
      ) : (
        <span className="text-sm text-muted-foreground">Non fourni</span>
      )}
    </div>
  )
}

function AgencyDetailSkeleton() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <Skeleton className="h-40 w-full rounded-none sm:h-52" />
        <div className="flex flex-col gap-4 p-5 sm:flex-row">
          <Skeleton className="size-24 shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </section>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  )
}

function AgencyEditForm({
  agency,
  onCancel,
  onUpdated,
  slug,
}: {
  agency: Agency
  onCancel: () => void
  onUpdated: (agency: Agency) => void
  slug: string
}) {
  const [values, setValues] = React.useState<EditValues>(() =>
    agencyToEditValues(agency)
  )
  const [error, setError] = React.useState("")
  const [pending, setPending] = React.useState(false)

  function updateValue(name: keyof EditValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!values.name.trim()) {
      setError("Le nom de l'agence est obligatoire.")
      return
    }

    setPending(true)

    try {
      const formData = new FormData()

      appendEditValue(formData, "name", values.name)
      appendEditValue(formData, "description", values.description)
      appendEditValue(formData, "email", values.email)
      appendEditValue(formData, "phone", values.phone)
      appendEditValue(formData, "website", values.website)
      appendEditValue(formData, "legal_name", values.legal_name)
      appendEditValue(formData, "legal_status", values.legal_status)
      appendEditValue(formData, "rccm_number", values.rccm_number)
      appendEditValue(formData, "tax_number", values.tax_number)
      formData.append("is_active", values.is_active ? "true" : "false")

      const updatedAgency = await apiFetch<Agency>(
        `/api/agencies/${encodeURIComponent(slug)}/`,
        {
          body: formData,
          method: "PATCH",
        }
      )

      onUpdated(updatedAgency)
      toast({
        description: "Les informations de l'agence ont été mises à jour.",
        title: "Agence modifiée",
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
    <form
      id="modifier"
      className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm"
      onSubmit={onSubmit}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Modifier l&apos;agence</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mettez à jour les informations principales de cette agence.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X />
          Annuler
        </Button>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Nom de l'agence *"
          name="name"
          value={values.name}
          required
          onChange={updateValue}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={updateValue}
        />
        <Field
          label="Téléphone"
          name="phone"
          value={values.phone}
          onChange={updateValue}
        />
        <Field
          label="Site web"
          name="website"
          type="url"
          value={values.website}
          onChange={updateValue}
        />
        <Field
          label="Nom légal"
          name="legal_name"
          value={values.legal_name}
          onChange={updateValue}
        />
        <div className="space-y-2">
          <label className={labelClassName} htmlFor="edit-legal_status">
            Statut légal
          </label>
          <select
            className={inputClassName}
            id="edit-legal_status"
            name="legal_status"
            value={values.legal_status}
            onChange={(event) =>
              updateValue("legal_status", event.target.value)
            }
          >
            <option value="">Sélectionner</option>
            {legalStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Numéro RCCM"
          name="rccm_number"
          value={values.rccm_number}
          onChange={updateValue}
        />
        <Field
          label="Numéro fiscal"
          name="tax_number"
          value={values.tax_number}
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
            onChange={(event) => updateValue("description", event.target.value)}
          />
        </div>
        <label className="flex items-center justify-between gap-3 rounded-md border border-border p-3 md:col-span-2">
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
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="submit" className="h-10" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Enregistrer
        </Button>
      </div>
    </form>
  )
}

function AgencyDetailContent({ slug }: { slug: string }) {
  const router = useRouter()
  const [agency, setAgency] = React.useState<Agency | null>(null)
  const [deleteError, setDeleteError] = React.useState("")
  const [deletePending, setDeletePending] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [error, setError] = React.useState("")
  const [editing, setEditing] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  const detailSlug = agency ? agencySlug(agency) || slug : slug

  const loadAgency = React.useCallback(
    async (signal?: AbortSignal) => {
      try {
        const nextAgency = await apiFetch<Agency>(
          `/api/agencies/${encodeURIComponent(slug)}/`,
          { signal }
        )

        if (signal?.aborted) {
          return
        }

        setAgency(nextAgency)
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
    },
    [slug]
  )

  React.useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadAgency(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadAgency])

  function reloadAgency() {
    setLoading(true)
    setError("")
    void loadAgency()
  }

  function onUpdated(updatedAgency: Agency) {
    setAgency((current) => ({ ...(current ?? {}), ...updatedAgency }))
    setEditing(false)
  }

  async function deleteAgency() {
    if (!detailSlug) {
      setDeleteError("Cette agence ne contient pas de slug.")
      return
    }

    setDeletePending(true)
    setDeleteError("")

    try {
      await apiFetch<void>(`/api/agencies/${encodeURIComponent(detailSlug)}/`, {
        method: "DELETE",
      })

      toast({
        description: "L'agence a été supprimée.",
        title: "Agence supprimée",
        variant: "success",
      })
      router.push("/dashboard/agencies")
      router.refresh()
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
    <DashboardShell
      title={agency ? agencyDisplayName(agency) : "Détails agence"}
      breadcrumbs={[
        { href: "/dashboard/agencies", label: "Agences" },
        { label: "Détails" },
      ]}
    >
      {loading ? <AgencyDetailSkeleton /> : null}

      {!loading && error ? (
        <section className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-destructive">
          <h2 className="text-lg font-semibold">Agence introuvable</h2>
          <p className="mt-2 text-sm leading-6">{error}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/agencies">
                <ArrowLeft />
                Retour aux agences
              </Link>
            </Button>
            <Button type="button" onClick={reloadAgency}>
              <RefreshCw />
              Réessayer
            </Button>
          </div>
        </section>
      ) : null}

      {!loading && agency ? (
        <>
          <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
            <MediaBlock image={agency.cover_image} type="cover" />
            <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row">
                <MediaBlock image={agency.logo} type="logo" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold">
                      {agencyDisplayName(agency)}
                    </h2>
                    <StatusPill muted={agency.is_active === false}>
                      {statusLabel(agency.is_active)}
                    </StatusPill>
                    <StatusPill muted={!agency.is_verified}>
                      {verificationStatusLabel(agency.verification_status)}
                    </StatusPill>
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {agency.description?.trim() ||
                      "Aucune description pour cette agence."}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Dernière mise à jour : {formatDate(agency.updated_at)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                <Button asChild variant="outline">
                  <Link href="/dashboard/agencies">
                    <ArrowLeft />
                    Retour
                  </Link>
                </Button>
                <Button type="button" onClick={() => setEditing(true)}>
                  <Pencil />
                  Modifier l&apos;agence
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setDeleteError("")
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 />
                  Supprimer
                </Button>
              </div>
            </div>
          </section>

          {editing ? (
            <AgencyEditForm
              agency={agency}
              slug={detailSlug}
              onCancel={() => setEditing(false)}
              onUpdated={onUpdated}
            />
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <InfoCard icon={MapPin} title="Adresse">
                <DetailRow
                  label="Localisation"
                  value={agencyAddressLabel(agency)}
                />
                <DetailRow label="Pays" value={agency.country} />
                <DetailRow
                  label="Division administrative"
                  value={agency.administrative_area}
                />
                <DetailRow label="Localité" value={agency.locality} />
                <DetailRow label="Quartier" value={agency.sub_locality} />
              </InfoCard>

              <InfoCard icon={ShieldCheck} title="Informations légales">
                <DetailRow label="Nom légal" value={agency.legal_name} />
                <DetailRow
                  label="Statut légal"
                  value={legalStatusLabel(agency.legal_status)}
                />
                <DetailRow label="Numéro RCCM" value={agency.rccm_number} />
                <DetailRow label="Numéro fiscal" value={agency.tax_number} />
              </InfoCard>
            </div>

            <div className="space-y-4">
              <InfoCard icon={Phone} title="Contact">
                <DetailRow
                  label="Email"
                  value={
                    agency.email ? (
                      <a
                        href={`mailto:${agency.email}`}
                        className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                      >
                        <Mail className="size-3.5" />
                        {agency.email}
                      </a>
                    ) : (
                      "-"
                    )
                  }
                />
                <DetailRow
                  label="Téléphone"
                  value={
                    agency.phone ? (
                      <a
                        href={`tel:${agency.phone}`}
                        className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                      >
                        <Phone className="size-3.5" />
                        {agency.phone}
                      </a>
                    ) : (
                      "-"
                    )
                  }
                />
                <DetailRow
                  label="Site web"
                  value={
                    agency.website ? (
                      <a
                        href={agency.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                      >
                        Ouvrir le site
                        <ExternalLink className="size-3.5" />
                      </a>
                    ) : (
                      "-"
                    )
                  }
                />
              </InfoCard>

              <InfoCard icon={BadgeCheck} title="Vérification">
                <DetailRow
                  label="Agence vérifiée"
                  value={yesNoLabel(agency.is_verified)}
                />
                <DetailRow
                  label="Statut"
                  value={verificationStatusLabel(agency.verification_status)}
                />
                <DetailRow
                  label="Vérification le"
                  value={formatDate(agency.verified_at)}
                />
                <DetailRow
                  label="Message"
                  value={agency.verification_message}
                />
              </InfoCard>

              <InfoCard icon={User} title="Responsable">
                <DetailRow label="Nom" value={agencyOwnerName(agency.owner)} />
                <DetailRow label="Email" value={agency.owner?.email} />
                <DetailRow
                  label="Téléphone"
                  value={agency.owner?.phone_number}
                />
              </InfoCard>
            </div>
          </div>

          <InfoCard icon={FileText} title="Documents">
            <DocumentLink
              label="Document d'identité"
              value={agency.national_id_document}
            />
            <DocumentLink
              label="Document RCCM"
              value={agency.business_registration_document}
            />
            <DocumentLink label="Document fiscal" value={agency.tax_document} />
            <DocumentLink
              label="Preuve d'adresse"
              value={agency.proof_of_address}
            />
          </InfoCard>

          {deleteDialogOpen ? (
            <DeleteConfirmDialog
              title="Supprimer l'agence"
              description={`Vous allez supprimer ${agencyDisplayName(
                agency
              )}. Cette action est définitive.`}
              error={deleteError}
              pending={deletePending}
              onClose={() => {
                if (!deletePending) {
                  setDeleteDialogOpen(false)
                }
              }}
              onConfirm={deleteAgency}
            />
          ) : null}
        </>
      ) : null}
    </DashboardShell>
  )
}

export { AgencyDetailContent }

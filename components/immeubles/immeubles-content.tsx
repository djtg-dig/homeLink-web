"use client"

import * as React from "react"
import Link from "next/link"
import {
  Building2,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  X,
} from "lucide-react"

import { DashboardActionsMenu } from "@/components/dashboard/dashboard-actions-menu"
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
import { ApiError, apiFetch, jsonHeaders } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import {
  booleanLabel,
  immeubleDisplayName,
  immeubleId,
  immeubleTypeLabel,
  parseImmeubles,
  type Immeuble,
  type ImmeublesResponse,
} from "@/lib/immeubles"
import { cn } from "@/lib/utils"

type ImmeubleFormValues = {
  ascenseur: boolean
  jardin: boolean
  nom: string
  nombre_etages: string
  piscine: boolean
  type_immeuble: string
}

const typeOptions = [
  { label: "Résidentiel", value: "RES" },
  { label: "Mixte", value: "MIX" },
  { label: "Commercial", value: "COM" },
]

const inputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
const labelClassName = "text-sm font-medium text-foreground"

function requiredText(value: string, label: string) {
  const nextValue = value.trim()

  if (!nextValue) {
    throw new Error(`${label} est obligatoire.`)
  }

  return nextValue
}

function requiredPositiveInteger(value: string, label: string) {
  const nextValue = requiredText(value, label)

  if (!/^\d+$/.test(nextValue) || Number(nextValue) <= 0) {
    throw new Error(`${label} doit être un nombre entier positif.`)
  }

  return Number(nextValue)
}

function formValuesFromImmeuble(immeuble: Immeuble): ImmeubleFormValues {
  return {
    ascenseur: Boolean(immeuble.ascenseur),
    jardin: Boolean(immeuble.jardin),
    nom: immeuble.nom?.trim() ?? "",
    nombre_etages:
      immeuble.nombre_etages === undefined || immeuble.nombre_etages === null
        ? ""
        : String(immeuble.nombre_etages),
    piscine: Boolean(immeuble.piscine),
    type_immeuble: immeuble.type_immeuble?.trim() || "RES",
  }
}

function buildImmeublePayload(values: ImmeubleFormValues) {
  return {
    ascenseur: values.ascenseur,
    jardin: values.jardin,
    nom: requiredText(values.nom, "Le nom"),
    nombre_etages: requiredPositiveInteger(
      values.nombre_etages,
      "Le nombre d'étages"
    ),
    piscine: values.piscine,
    type_immeuble: values.type_immeuble,
  }
}

function ImmeublesTableSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <tr key={index} className="border-b border-border last:border-b-0">
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0" />
              <Skeleton className="h-4 w-44" />
            </div>
          </td>
          <td className="hidden px-4 py-4 sm:table-cell">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="hidden px-4 py-4 md:table-cell">
            <Skeleton className="h-4 w-20" />
          </td>
          <td className="hidden px-4 py-4 lg:table-cell">
            <Skeleton className="h-4 w-52" />
          </td>
          <td className="px-4 py-4 text-right">
            <Skeleton className="ml-auto h-7 w-24" />
          </td>
        </tr>
      ))}
    </>
  )
}

function FeaturePill({
  active,
  label,
}: {
  active?: boolean | null
  label: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
        active
          ? "bg-secondary text-secondary-foreground"
          : "bg-muted text-muted-foreground"
      )}
    >
      {active ? <CheckCircle2 className="size-3" /> : null}
      {label}: {booleanLabel(active)}
    </span>
  )
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
  inputMode?: "numeric" | "text"
  label: string
  name: keyof ImmeubleFormValues
  onChange: (name: keyof ImmeubleFormValues, value: string) => void
  placeholder?: string
  required?: boolean
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

function ImmeubleEditDialog({
  immeuble,
  onClose,
  onUpdated,
}: {
  immeuble: Immeuble
  onClose: () => void
  onUpdated: (immeuble: Immeuble) => void
}) {
  const [values, setValues] = React.useState<ImmeubleFormValues>(() =>
    formValuesFromImmeuble(immeuble)
  )
  const [error, setError] = React.useState("")
  const [pending, setPending] = React.useState(false)

  function updateValue(name: keyof ImmeubleFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function updateBoolean(name: keyof ImmeubleFormValues, checked: boolean) {
    setValues((current) => ({ ...current, [name]: checked }))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const id = immeubleId(immeuble)

    if (!id) {
      setError("Cet immeuble ne contient pas d'identifiant.")
      return
    }

    setPending(true)

    try {
      const payload = buildImmeublePayload(values)
      const updatedImmeuble = await apiFetch<Partial<Immeuble> | undefined>(
        `/api/immovables/immeubles/${encodeURIComponent(id)}/`,
        {
          body: JSON.stringify(payload),
          headers: jsonHeaders(),
          method: "PATCH",
        }
      )

      onUpdated({
        ...immeuble,
        ...payload,
        ...(updatedImmeuble ?? {}),
      })
      toast({
        description: "Les informations de l'immeuble ont été mises à jour.",
        title: "Immeuble modifié",
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
      aria-labelledby="edit-immeuble-title"
    >
      <form
        className="max-h-[92svh] w-full overflow-y-auto rounded-t-lg border border-border bg-card text-card-foreground shadow-xl sm:max-w-2xl sm:rounded-lg"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              Modification d&apos;immeuble
            </p>
            <h2
              id="edit-immeuble-title"
              className="mt-1 truncate text-xl font-semibold"
            >
              {immeubleDisplayName(immeuble)}
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

        <div className="space-y-4 p-4">
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Nom *"
              name="nom"
              value={values.nom}
              required
              placeholder="Résidence Maman Yemo"
              onChange={updateValue}
            />
            <div className="space-y-2">
              <label className={labelClassName} htmlFor="edit-type_immeuble">
                Type d&apos;immeuble
              </label>
              <Select
                value={values.type_immeuble}
                onValueChange={(nextValue) =>
                  updateValue("type_immeuble", nextValue)
                }
              >
                <SelectTrigger id="edit-type_immeuble" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TextField
              label="Nombre d'étages *"
              name="nombre_etages"
              value={values.nombre_etages}
              inputMode="numeric"
              required
              placeholder="12"
              onChange={updateValue}
            />
            <div className="grid gap-3 sm:grid-cols-3 md:col-span-2">
              <SwitchField
                label="Ascenseur"
                checked={values.ascenseur}
                onChange={(checked) => updateBoolean("ascenseur", checked)}
              />
              <SwitchField
                label="Piscine"
                checked={values.piscine}
                onChange={(checked) => updateBoolean("piscine", checked)}
              />
              <SwitchField
                label="Jardin"
                checked={values.jardin}
                onChange={(checked) => updateBoolean("jardin", checked)}
              />
            </div>
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

function ImmeublesContent() {
  const [immeubles, setImmeubles] = React.useState<Immeuble[]>([])
  const [count, setCount] = React.useState(0)
  const [deleteError, setDeleteError] = React.useState("")
  const [deletePending, setDeletePending] = React.useState(false)
  const [deletingImmeuble, setDeletingImmeuble] =
    React.useState<Immeuble | null>(null)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [editingImmeuble, setEditingImmeuble] = React.useState<Immeuble | null>(
    null
  )

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
      setCount(parsed.count)
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
      void loadImmeubles(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadImmeubles])

  function reloadImmeubles() {
    setLoading(true)
    setError("")
    void loadImmeubles()
  }

  function updateImmeuble(updatedImmeuble: Immeuble) {
    const updatedId = immeubleId(updatedImmeuble)

    setImmeubles((current) =>
      current.map((immeuble) =>
        immeubleId(immeuble) === updatedId ? updatedImmeuble : immeuble
      )
    )
    setEditingImmeuble(null)
  }

  function openDeleteDialog(immeuble: Immeuble) {
    setDeleteError("")
    setDeletingImmeuble(immeuble)
  }

  async function deleteImmeuble() {
    if (!deletingImmeuble) {
      return
    }

    const id = immeubleId(deletingImmeuble)

    if (!id) {
      setDeleteError("Cet immeuble ne contient pas d'identifiant.")
      return
    }

    setDeletePending(true)
    setDeleteError("")

    try {
      await apiFetch<void>(
        `/api/immovables/immeubles/${encodeURIComponent(id)}/`,
        {
          method: "DELETE",
        }
      )

      setImmeubles((current) =>
        current.filter((immeuble) => immeubleId(immeuble) !== id)
      )
      setCount((current) => Math.max(0, current - 1))
      setDeletingImmeuble(null)
      toast({
        description: "L'immeuble a été supprimé.",
        title: "Immeuble supprimé",
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
      <DashboardShell title="Immeubles" breadcrumbs={[{ label: "Immeubles" }]}>
        <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Gestion des immeubles
              </p>
              <h2 className="mt-1 text-2xl font-semibold">Immeubles</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Créez les immeubles qui pourront ensuite être associés aux
                appartements.
              </p>
            </div>
            <Button asChild className="h-10 w-full lg:w-auto">
              <Link href="/dashboard/immeubles/new">
                <Plus />
                Créer un immeuble
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
            <p className="text-sm text-muted-foreground">Total immeubles</p>
            {loading ? (
              <Skeleton className="mt-3 h-9 w-20" />
            ) : (
              <p className="mt-3 text-3xl font-semibold">{count}</p>
            )}
          </article>
          <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
            <p className="text-sm text-muted-foreground">Usage</p>
            <p className="mt-3 text-sm font-medium">
              Sélection possible lors de la création d&apos;un appartement.
            </p>
          </article>
        </section>

        <section className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Liste des immeubles</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sélectionnez ou créez les immeubles disponibles pour les
                appartements.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={reloadImmeubles}
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
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Immeuble</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">
                    Type
                  </th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">
                    Étages
                  </th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">
                    Équipements
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <ImmeublesTableSkeleton /> : null}

                {!loading && immeubles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12">
                      <div className="mx-auto flex max-w-md flex-col items-center text-center">
                        <span className="flex size-12 items-center justify-center rounded-md bg-secondary text-primary">
                          <Building2 className="size-6" />
                        </span>
                        <h3 className="mt-4 text-base font-semibold">
                          Aucun immeuble pour le moment
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Créez un immeuble pour pouvoir l&apos;associer à un
                          appartement.
                        </p>
                        <Button asChild className="mt-4">
                          <Link href="/dashboard/immeubles/new">
                            <Plus />
                            Créer un immeuble
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : null}

                {!loading
                  ? immeubles.map((immeuble, index) => {
                      const key =
                        immeubleId(immeuble) || `${immeuble.nom}-${index}`
                      const canEdit = Boolean(immeubleId(immeuble))

                      return (
                        <tr
                          key={key}
                          className="border-b border-border last:border-b-0"
                        >
                          <td className="min-w-0 px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                                <Building2 className="size-5" />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold">
                                  {immeubleDisplayName(immeuble)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground sm:hidden">
                                  {immeubleTypeLabel(immeuble.type_immeuble)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden px-4 py-4 sm:table-cell">
                            {immeubleTypeLabel(immeuble.type_immeuble)}
                          </td>
                          <td className="hidden px-4 py-4 md:table-cell">
                            {immeuble.nombre_etages ?? "-"}
                          </td>
                          <td className="hidden px-4 py-4 lg:table-cell">
                            <div className="flex flex-wrap gap-2">
                              <FeaturePill
                                label="Ascenseur"
                                active={immeuble.ascenseur}
                              />
                              <FeaturePill
                                label="Piscine"
                                active={immeuble.piscine}
                              />
                              <FeaturePill
                                label="Jardin"
                                active={immeuble.jardin}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <DashboardActionsMenu
                              onEdit={
                                canEdit
                                  ? () => setEditingImmeuble(immeuble)
                                  : undefined
                              }
                              onDelete={
                                canEdit
                                  ? () => openDeleteDialog(immeuble)
                                  : undefined
                              }
                            />
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

      {editingImmeuble ? (
        <ImmeubleEditDialog
          immeuble={editingImmeuble}
          onClose={() => setEditingImmeuble(null)}
          onUpdated={updateImmeuble}
        />
      ) : null}

      {deletingImmeuble ? (
        <DeleteConfirmDialog
          title="Supprimer l'immeuble"
          description={`Vous allez supprimer ${immeubleDisplayName(
            deletingImmeuble
          )}. Cette action est définitive.`}
          error={deleteError}
          pending={deletePending}
          onClose={() => {
            if (!deletePending) {
              setDeletingImmeuble(null)
            }
          }}
          onConfirm={deleteImmeuble}
        />
      ) : null}
    </>
  )
}

export { ImmeublesContent }

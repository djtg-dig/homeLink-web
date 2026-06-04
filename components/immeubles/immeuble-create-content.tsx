"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Building2, CheckCircle2, Loader2, Save } from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/toaster"
import { ApiError, apiPostJson } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import { immeubleTypeLabel } from "@/lib/immeubles"

type ImmeubleFormValues = {
  ascenseur: boolean
  jardin: boolean
  nom: string
  nombre_etages: string
  piscine: boolean
  type_immeuble: string
}

const initialValues: ImmeubleFormValues = {
  ascenseur: false,
  jardin: false,
  nom: "",
  nombre_etages: "",
  piscine: false,
  type_immeuble: "RES",
}

const typeOptions = [
  { label: "Residentiel", value: "RES" },
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
    throw new Error(`${label} doit etre un nombre entier positif.`)
  }

  return Number(nextValue)
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

function ImmeubleCreateContent() {
  const router = useRouter()
  const [values, setValues] = React.useState<ImmeubleFormValues>(initialValues)
  const [error, setError] = React.useState("")
  const [pending, setPending] = React.useState(false)

  function updateValue(name: keyof ImmeubleFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function updateBoolean(name: keyof ImmeubleFormValues, checked: boolean) {
    setValues((current) => ({ ...current, [name]: checked }))
  }

  function buildPayload() {
    return {
      ascenseur: values.ascenseur,
      jardin: values.jardin,
      nom: requiredText(values.nom, "Le nom"),
      nombre_etages: requiredPositiveInteger(
        values.nombre_etages,
        "Le nombre d'etages"
      ),
      piscine: values.piscine,
      type_immeuble: values.type_immeuble,
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setPending(true)

    try {
      const payload = buildPayload()

      await apiPostJson<unknown>("/api/immovables/immeubles/", payload)
      toast({
        description:
          "L'immeuble peut maintenant etre selectionne pour un appartement.",
        title: "Immeuble cree",
        variant: "success",
      })
      router.push("/dashboard/immeubles")
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(formatApiMessage(caughtError.body, "Creation impossible."))
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Creation impossible."
        )
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <DashboardShell
      title="Nouvel immeuble"
      breadcrumbs={[
        { href: "/dashboard/immeubles", label: "Immeubles" },
        { label: "Creation" },
      ]}
    >
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Creation d&apos;immeuble
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Enregistrer un immeuble
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Creez l&apos;immeuble avant de rattacher des appartements a ses
              etages.
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
        <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
          <div className="mb-5 flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
              <Building2 className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Informations</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Donnees necessaires pour selectionner cet immeuble dans un
                appartement.
              </p>
            </div>
          </div>

          {error ? (
            <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Nom *"
              name="nom"
              value={values.nom}
              required
              placeholder="Residence Maman Yemo"
              onChange={updateValue}
            />
            <div className="space-y-2">
              <label className={labelClassName} htmlFor="type_immeuble">
                Type d&apos;immeuble
              </label>
              <Select
                value={values.type_immeuble}
                onValueChange={(nextValue) =>
                  updateValue("type_immeuble", nextValue)
                }
              >
                <SelectTrigger id="type_immeuble" className="h-10 w-full">
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
              label="Nombre d'etages *"
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
        </section>

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
                  Immeuble
                </p>
                <p className="mt-1 font-semibold">{values.nom.trim() || "-"}</p>
                <p className="mt-1 text-muted-foreground">
                  {immeubleTypeLabel(values.type_immeuble)}
                </p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">Etages</p>
                <p className="mt-1 font-medium">
                  {values.nombre_etages.trim() || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Equipements
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    ["Ascenseur", values.ascenseur],
                    ["Piscine", values.piscine],
                    ["Jardin", values.jardin],
                  ]
                    .filter(([, active]) => Boolean(active))
                    .map(([label]) => (
                      <span
                        key={String(label)}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                      >
                        <CheckCircle2 className="size-3" />
                        {label}
                      </span>
                    ))}
                </div>
              </div>
              <Button className="h-10 w-full" type="submit" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <Save />}
                Creer l&apos;immeuble
              </Button>
            </div>
          </div>
        </aside>
      </form>
    </DashboardShell>
  )
}

export { ImmeubleCreateContent }

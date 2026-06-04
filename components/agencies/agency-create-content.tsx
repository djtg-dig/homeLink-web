"use client"

import { FormEvent, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  CheckCircle2,
  FileCheck2,
  ImagePlus,
  Loader2,
  Scale,
  Send,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import {
  AddressCreateSection,
  emptyAddressSummary,
  type AddressCreateSectionHandle,
  type AddressSummary,
} from "@/components/localisation/address-create-section"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toaster"
import { ApiError, apiFetch } from "@/lib/api-client"
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
    label: "Document d'identité",
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

function TextField({
  label,
  name,
  onChange,
  placeholder,
  required,
  type = "text",
  value,
}: {
  label: string
  name: keyof AgencyFormValues
  onChange: (name: keyof AgencyFormValues, value: string) => void
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
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(name, event.target.value)}
      />
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
        {file ? file.name : "Aucun fichier sélectionné"}
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
  const router = useRouter()
  const addressSectionRef = useRef<AddressCreateSectionHandle>(null)
  const [values, setValues] = useState<AgencyFormValues>(initialValues)
  const [addressSummary, setAddressSummary] =
    useState<AddressSummary>(emptyAddressSummary)
  const [files, setFiles] = useState<FileState>(initialFiles)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const selectedFiles = useMemo(
    () => Object.entries(files).filter(([, file]) => Boolean(file)),
    [files]
  )

  function updateValue(name: keyof AgencyFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function updateFile(name: FileField, file: File | null) {
    setFiles((current) => ({ ...current, [name]: file }))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!values.name.trim()) {
      setError("Le nom de l'agence est obligatoire.")
      return
    }

    if (!addressSectionRef.current) {
      setError("Le formulaire d'adresse est indisponible.")
      return
    }

    setPending(true)

    let currentStep: "address" | "agency" = "address"

    try {
      const addressId = await addressSectionRef.current.createAddress()
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
      toast({
        description: "L'agence est maintenant disponible dans la liste.",
        title: "Agence créée",
        variant: "success",
      })
      router.push("/dashboard/agencies")
    } catch (caughtError) {
      const fallback =
        currentStep === "address"
          ? "Création de l'adresse impossible."
          : "Création de l'agence impossible."

      if (caughtError instanceof ApiError) {
        setError(formatApiMessage(caughtError.body, fallback))
        return
      }

      setError(caughtError instanceof Error ? caughtError.message : fallback)
    } finally {
      setPending(false)
    }
  }

  return (
    <DashboardShell
      title="Nouvelle agence"
      breadcrumbs={[
        { href: "/dashboard/agencies", label: "Agences" },
        { label: "Création" },
      ]}
    >
      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Création d&apos;agence
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Enregistrer une nouvelle agence immobilière
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Renseignez les informations publiques, l&apos;adresse associée,
              les données légales et les pièces justificatives avant validation.
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
            <p
              aria-live="polite"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <Section
            icon={Building2}
            title="Informations publiques"
            description="Ces informations définissent la présentation de l'agence."
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
                label="Téléphone"
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
                  placeholder="Présentation courte de l'agence"
                  onChange={(event) =>
                    updateValue("description", event.target.value)
                  }
                />
              </div>
            </div>
          </Section>

          <Section
            icon={ImagePlus}
            title="Médias"
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

          <AddressCreateSection
            ref={addressSectionRef}
            disabled={pending}
            description="Créez l'adresse qui sera associée à cette agence."
            onSummaryChange={setAddressSummary}
          />

          <Section
            icon={Scale}
            title="Informations légales"
            description="Ces données facilitent la vérification administrative."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Nom légal"
                name="legal_name"
                value={values.legal_name}
                onChange={updateValue}
                placeholder="Raison sociale"
              />
              <div className="space-y-2">
                <label className={labelClassName} htmlFor="legal_status">
                  Statut légal
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
                  <option value="">Sélectionner</option>
                  {legalStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <TextField
                label="Numéro RCCM"
                name="rccm_number"
                value={values.rccm_number}
                onChange={updateValue}
              />
              <TextField
                label="Numéro fiscal"
                name="tax_number"
                value={values.tax_number}
                onChange={updateValue}
              />
            </div>
          </Section>

          <Section
            icon={FileCheck2}
            title="Documents"
            description="Joignez les pièces utiles pour l'analyse du dossier."
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
              <h2 className="text-base font-semibold">Récapitulatif</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Aperçu avant validation.
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
                  <p className="text-xs text-muted-foreground">Légal</p>
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
                <p className="mt-1">{filled(addressSummary.street)}</p>
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
                <p className="text-muted-foreground">
                  Code postal : {filled(addressSummary.postalCode)}
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
                Créer l&apos;agence
              </Button>
            </div>
          </div>
        </aside>
      </form>
    </DashboardShell>
  )
}

export { AgencyCreateContent }

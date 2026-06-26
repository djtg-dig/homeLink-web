"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  FileImage,
  Flame,
  Home,
  ImagePlus,
  KeyRound,
  Loader2,
  MapPin,
  RefreshCw,
  Save,
  ShieldCheck,
  Trees,
  X,
  type LucideIcon,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
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
import { ApiError, apiFetch, jsonHeaders } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import {
  maisonAddressLabel,
  maisonDisplayName,
  maisonId,
  maisonMediaGallery,
  mediaUrl,
  textValue,
  type Maison,
  type MaisonMedia,
} from "@/lib/maisons"

const NO_AGENCY_VALUE = "__none__"
const NO_ISOLATION_VALUE = "__none__"

type MaisonEditValues = {
  agency_id: string
  alarm: boolean
  barbecue: boolean
  bathroom_number: string
  building_year: string
  cellar: boolean
  chamber_number: string
  concierge: boolean
  description: string
  digicode: boolean
  domotique: boolean
  dpe: string
  elevator: boolean
  energy_class: string
  escapade_kitchen: boolean
  est_proprietaire: boolean
  fence: boolean
  fireplace: boolean
  garage: boolean
  garden: boolean
  garden_area: string
  garden_shed: boolean
  garner: boolean
  heating: string
  home_cinema: boolean
  home_type: string
  interphone: boolean
  is_active: boolean
  is_isolated: boolean
  isolation: string
  lodger_number: string
  place_number_garage: string
  pool: boolean
  pool_area: string
  premium_material: boolean
  prix_location_mensuel: string
  prix_vente: string
  renowned_architect: string
  renovation_need: boolean
  room_sport: boolean
  security_forward_system: boolean
  spa: boolean
  standing: string
  statut: string
  surface_habitable: string
  surface_totale: string
  terrace: boolean
  terrace_area: string
  title: string
  type_transaction: string
  unused: boolean
  veranda: boolean
  veranda_area: string
  view_sea: boolean
  watch_camera: boolean
}

type SelectedImage = {
  file: File
  previewUrl: string
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

const homeTypeOptions = [
  { label: "Standard", value: "standard" },
  { label: "Contemporaine", value: "contemporaine" },
  { label: "Traditionnelle", value: "traditionnelle" },
  { label: "Moderne", value: "moderne" },
  { label: "Fermette", value: "fermette" },
  { label: "Chalet", value: "chalet" },
]

const standingOptions = [
  { label: "Standard", value: "standard" },
  { label: "Haut standing", value: "haut_standing" },
  { label: "Luxe", value: "luxe" },
]

const energyClassOptions = ["A", "B", "C", "D", "E", "F", "G"].map((value) => ({
  label: value,
  value,
}))

const heatingOptions = [
  { label: "Aucun", value: "none" },
  { label: "Électrique", value: "electrique" },
  { label: "Gaz", value: "gaz" },
  { label: "Fioul", value: "fioul" },
  { label: "Bois", value: "bois" },
  { label: "Pompe à chaleur", value: "pompe_chaleur" },
  { label: "Solaire", value: "solaire" },
  { label: "Géothermique", value: "geothermique" },
]

const isolationOptions = [
  { label: "Non renseignée", value: NO_ISOLATION_VALUE },
  { label: "Laine de verre", value: "laine_verre" },
  { label: "Laine de roche", value: "laine_roche" },
  { label: "Polystyrène", value: "polystyrene" },
  { label: "Ouate de cellulose", value: "ouate_cellulose" },
  { label: "Liège", value: "liege" },
  { label: "Fibre de bois", value: "fibre_bois" },
]

const booleanFields: Array<{ label: string; name: keyof MaisonEditValues }> = [
  { label: "Maison isolée", name: "is_isolated" },
  { label: "Cuisine équipée", name: "escapade_kitchen" },
  { label: "Jardin", name: "garden" },
  { label: "Terrasse", name: "terrace" },
  { label: "Garage", name: "garage" },
  { label: "Piscine", name: "pool" },
  { label: "Véranda", name: "veranda" },
  { label: "Barbecue", name: "barbecue" },
  { label: "Abri de jardin", name: "garden_shed" },
  { label: "Clôture", name: "fence" },
  { label: "Cheminée", name: "fireplace" },
  { label: "Alarme", name: "alarm" },
  { label: "Caméras", name: "watch_camera" },
  { label: "Digicode", name: "digicode" },
  { label: "Interphone", name: "interphone" },
  { label: "Sécurité avancée", name: "security_forward_system" },
  { label: "Ascenseur", name: "elevator" },
  { label: "Cave", name: "cellar" },
  { label: "Grenier", name: "garner" },
  { label: "Vue mer", name: "view_sea" },
  { label: "Salle de sport", name: "room_sport" },
  { label: "Home cinéma", name: "home_cinema" },
  { label: "Spa", name: "spa" },
  { label: "Domotique", name: "domotique" },
  { label: "Concierge", name: "concierge" },
  { label: "Matériaux premium", name: "premium_material" },
  { label: "Inoccupée", name: "unused" },
  { label: "Rénovation nécessaire", name: "renovation_need" },
]

const compositionFields = [
  { label: "Chambres", name: "chamber_number", required: false },
  { label: "Salles de bain", name: "bathroom_number", required: false },
  { label: "Occupants", name: "lodger_number", required: false },
  { label: "Année de construction *", name: "building_year", required: true },
] as const

const areaFields = [
  { label: "Surface jardin", name: "garden_area" },
  { label: "Surface terrasse", name: "terrace_area" },
  { label: "Surface piscine", name: "pool_area" },
  { label: "Surface véranda", name: "veranda_area" },
] as const

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

function requiredInteger(value: string, label: string) {
  const nextValue = requiredText(value, label)

  if (!/^\d+$/.test(nextValue)) {
    throw new Error(`${label} doit être un nombre entier.`)
  }

  return Number(nextValue)
}

function optionalDecimal(value: string, label: string) {
  const nextValue = value.trim()

  if (!nextValue) {
    return undefined
  }

  if (!/^-?\d+([.,]\d+)?$/.test(nextValue)) {
    throw new Error(`${label} doit être un nombre.`)
  }

  return Number(nextValue.replace(",", "."))
}

function selectedBooleanLabels(values: MaisonEditValues) {
  return booleanFields.filter((field) => Boolean(values[field.name]))
}

function formValuesFromMaison(maison: Maison): MaisonEditValues {
  const details = maison.maison

  return {
    agency_id: maison.agency?.id ? String(maison.agency.id) : NO_AGENCY_VALUE,
    alarm: Boolean(details?.alarm),
    barbecue: Boolean(details?.barbecue),
    bathroom_number: textValue(details?.bathroom_number),
    building_year: textValue(details?.building_year),
    cellar: Boolean(details?.cellar),
    chamber_number: textValue(details?.chamber_number),
    concierge: Boolean(details?.concierge),
    description: maison.description?.trim() ?? "",
    digicode: Boolean(details?.digicode),
    domotique: Boolean(details?.domotique),
    dpe: details?.dpe?.trim() ?? "",
    elevator: Boolean(details?.elevator),
    energy_class: details?.energy_class?.trim() || "A",
    escapade_kitchen: Boolean(details?.escapade_kitchen),
    est_proprietaire: maison.est_proprietaire !== false,
    fence: Boolean(details?.fence),
    fireplace: Boolean(details?.fireplace),
    garage: Boolean(details?.garage),
    garden: Boolean(details?.garden),
    garden_area: textValue(details?.garden_area),
    garden_shed: Boolean(details?.garden_shed),
    garner: Boolean(details?.garner),
    heating: details?.heating?.trim() || "none",
    home_cinema: Boolean(details?.home_cinema),
    home_type: details?.home_type?.trim() || "standard",
    interphone: Boolean(details?.interphone),
    is_active: maison.is_active !== false,
    is_isolated: Boolean(details?.is_isolated),
    isolation: details?.isolation?.trim() || NO_ISOLATION_VALUE,
    lodger_number: textValue(details?.lodger_number),
    place_number_garage: textValue(details?.place_number_garage),
    pool: Boolean(details?.pool),
    pool_area: textValue(details?.pool_area),
    premium_material: Boolean(details?.premium_material),
    prix_location_mensuel: textValue(maison.prix_location_mensuel),
    prix_vente: textValue(maison.prix_vente),
    renowned_architect: details?.renowned_architect?.trim() ?? "",
    renovation_need: Boolean(details?.renovation_need),
    room_sport: Boolean(details?.room_sport),
    security_forward_system: Boolean(details?.security_forward_system),
    spa: Boolean(details?.spa),
    standing: details?.standing?.trim() || "standard",
    statut: maison.statut?.trim() || "disponible",
    surface_habitable: textValue(maison.surface_habitable),
    surface_totale: textValue(maison.surface_totale),
    terrace: Boolean(details?.terrace),
    terrace_area: textValue(details?.terrace_area),
    title: maison.title?.trim() ?? "",
    type_transaction: maison.type_transaction?.trim() || "vente",
    unused: Boolean(details?.unused),
    veranda: Boolean(details?.veranda),
    veranda_area: textValue(details?.veranda_area),
    view_sea: Boolean(details?.view_sea),
    watch_camera: Boolean(details?.watch_camera),
  }
}

function buildMaisonPatchPayload(values: MaisonEditValues) {
  const maison: Record<string, unknown> = {
    building_year: requiredInteger(
      values.building_year,
      "L'année de construction"
    ),
    energy_class: values.energy_class,
    heating: values.heating,
    home_type: values.home_type,
    isolation:
      values.isolation === NO_ISOLATION_VALUE ? null : values.isolation,
    standing: values.standing,
  }

  booleanFields.forEach((field) => {
    maison[field.name] = Boolean(values[field.name])
  })

  const integerFields: Array<keyof MaisonEditValues> = [
    "bathroom_number",
    "chamber_number",
    "lodger_number",
    "place_number_garage",
  ]

  integerFields.forEach((field) => {
    const value = optionalInteger(values[field] as string, String(field))

    if (value !== undefined) {
      maison[field] = value
    }
  })

  areaFields.forEach((field) => {
    const value = optionalDecimal(values[field.name], field.label)

    if (value !== undefined) {
      maison[field.name] = value
    }
  })

  const architect = optionalText(values.renowned_architect)
  const dpe = optionalText(values.dpe)

  if (architect !== undefined) {
    maison.renowned_architect = architect
  }

  if (dpe !== undefined) {
    maison.dpe = dpe
  }

  return maison
}

function buildPatchPayload(values: MaisonEditValues) {
  const price =
    values.type_transaction === "vente"
      ? requiredText(values.prix_vente, "Le prix de vente")
      : requiredText(
          values.prix_location_mensuel,
          "Le prix de location mensuel"
        )

  return {
    agency_id: values.agency_id === NO_AGENCY_VALUE ? null : values.agency_id,
    description: values.description.trim(),
    est_proprietaire: values.est_proprietaire,
    is_active: values.is_active,
    maison: buildMaisonPatchPayload(values),
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

function TextField({
  inputMode,
  label,
  name,
  onChange,
  placeholder,
  required,
  value,
}: {
  inputMode?: "decimal" | "numeric" | "text"
  label: string
  name: keyof MaisonEditValues
  onChange: (name: keyof MaisonEditValues, value: string) => void
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

function SelectField({
  label,
  name,
  onChange,
  options,
  value,
}: {
  label: string
  name: keyof MaisonEditValues
  onChange: (name: keyof MaisonEditValues, value: string) => void
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
  icon: LucideIcon
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

function ImagePreview({ media }: { media: MaisonMedia }) {
  const url = mediaUrl(media)

  if (!url) {
    return null
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-md border border-border bg-muted"
    >
      <span
        className="block aspect-video bg-cover bg-center transition group-hover:scale-[1.02]"
        style={{ backgroundImage: `url(${url})` }}
      />
      <span className="block truncate px-3 py-2 text-sm font-medium">
        {media.title?.trim() || "Image existante"}
      </span>
    </a>
  )
}

function MaisonEditSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

function MaisonEditContent({ id }: { id: string }) {
  const router = useRouter()
  const [maison, setMaison] = React.useState<Maison | null>(null)
  const [values, setValues] = React.useState<MaisonEditValues | null>(null)
  const [agencies, setAgencies] = React.useState<Agency[]>([])
  const [agenciesError, setAgenciesError] = React.useState("")
  const [error, setError] = React.useState("")
  const [selectedMainImage, setSelectedMainImage] =
    React.useState<SelectedImage | null>(null)
  const [selectedImages, setSelectedImages] = React.useState<SelectedImage[]>(
    []
  )
  const selectedMainImageRef = React.useRef<SelectedImage | null>(null)
  const selectedImagesRef = React.useRef<SelectedImage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [pending, setPending] = React.useState(false)

  const loadEditData = React.useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)

      try {
        const [nextMaison, agenciesResponse] = await Promise.all([
          apiFetch<Maison>(
            `/api/immovables/maisons/${encodeURIComponent(id)}/`,
            {
              signal,
            }
          ),
          apiFetch<AgenciesResponse>("/api/agencies/", { signal }),
        ])
        const parsedAgencies = parseAgencies(agenciesResponse)

        if (signal?.aborted) {
          return
        }

        setMaison(nextMaison)
        setValues(formValuesFromMaison(nextMaison))
        setAgencies(parsedAgencies.agencies)
        setAgenciesError("")
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
    [id]
  )

  React.useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadEditData(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadEditData])

  React.useEffect(() => {
    return () => {
      if (selectedMainImageRef.current) {
        URL.revokeObjectURL(selectedMainImageRef.current.previewUrl)
      }
      selectedImagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl)
      })
    }
  }, [])

  function updateValue(name: keyof MaisonEditValues, value: string) {
    setValues((current) => (current ? { ...current, [name]: value } : current))
  }

  function updateBoolean(name: keyof MaisonEditValues, checked: boolean) {
    setValues((current) =>
      current ? { ...current, [name]: checked } : current
    )
  }

  function updateMainImage(file: File | null) {
    if (selectedMainImageRef.current) {
      URL.revokeObjectURL(selectedMainImageRef.current.previewUrl)
    }

    const nextImage = file
      ? {
          file,
          previewUrl: URL.createObjectURL(file),
        }
      : null

    selectedMainImageRef.current = nextImage
    setSelectedMainImage(nextImage)
  }

  function updateImages(files: FileList | null) {
    if (!files) {
      return
    }

    const nextImages = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setSelectedImages((current) => {
      const nextSelectedImages = [...current, ...nextImages]

      selectedImagesRef.current = nextSelectedImages

      return nextSelectedImages
    })
  }

  function removeImageFile(index: number) {
    setSelectedImages((current) => {
      const removedImage = current[index]

      if (removedImage) {
        URL.revokeObjectURL(removedImage.previewUrl)
      }

      const nextSelectedImages = current.filter(
        (_, fileIndex) => fileIndex !== index
      )

      selectedImagesRef.current = nextSelectedImages

      return nextSelectedImages
    })
  }

  function clearSelectedImages() {
    if (selectedMainImageRef.current) {
      URL.revokeObjectURL(selectedMainImageRef.current.previewUrl)
    }
    selectedMainImageRef.current = null
    setSelectedMainImage(null)
    selectedImagesRef.current.forEach((image) => {
      URL.revokeObjectURL(image.previewUrl)
    })
    selectedImagesRef.current = []
    setSelectedImages([])
  }

  async function uploadImages(mainImage: File | null, files: File[]) {
    if (!mainImage && files.length === 0) {
      return undefined
    }

    const formData = new FormData()

    if (mainImage) {
      formData.append("main_image", mainImage)
    }

    files.forEach((file) => {
      formData.append("images", file)
    })

    return apiFetch<Partial<Maison> | undefined>(
      `/api/immovables/maisons/${encodeURIComponent(id)}/`,
      {
        body: formData,
        method: "PATCH",
      }
    )
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!values) {
      return
    }

    setError("")
    setPending(true)

    try {
      const payload = buildPatchPayload(values)
      const updatedMaison = await apiFetch<Partial<Maison> | undefined>(
        `/api/immovables/maisons/${encodeURIComponent(id)}/`,
        {
          body: JSON.stringify(payload),
          headers: jsonHeaders(),
          method: "PATCH",
        }
      )
      let mediaUpdate: Partial<Maison> | undefined
      let mediaError = ""

      try {
        mediaUpdate = await uploadImages(
          selectedMainImage?.file ?? null,
          selectedImages.map((image) => image.file)
        )
      } catch (caughtError) {
        if (caughtError instanceof ApiError) {
          mediaError = formatApiMessage(
            caughtError.body,
            "Les informations ont été sauvegardées, mais l'envoi des images a échoué."
          )
        } else {
          mediaError =
            caughtError instanceof Error
              ? caughtError.message
              : "Les informations ont été sauvegardées, mais l'envoi des images a échoué."
        }
      }

      const nextMaison = {
        ...(maison ?? {}),
        ...payload,
        ...(updatedMaison ?? {}),
        ...(mediaUpdate ?? {}),
      } as Maison

      setMaison(nextMaison)
      setValues(formValuesFromMaison(nextMaison))

      if (mediaError) {
        setError(mediaError)
        toast({
          description: mediaError,
          title: "Images non envoyées",
          variant: "destructive",
        })
        router.refresh()
        return
      }

      toast({
        description:
          selectedMainImage || selectedImages.length > 0
            ? "Les informations et les images de la maison ont été mises à jour."
            : "Les informations de la maison ont été mises à jour.",
        title: "Maison modifiée",
        variant: "success",
      })
      clearSelectedImages()
      router.push(
        `/dashboard/maisons/${encodeURIComponent(maisonId(nextMaison) || id)}`
      )
      router.refresh()
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

  const selectedOptions = values ? selectedBooleanLabels(values) : []
  const existingImages = maison ? maisonMediaGallery(maison) : []
  const title = maison ? `Modifier ${maisonDisplayName(maison)}` : "Modifier"

  return (
    <DashboardShell
      title={title}
      breadcrumbs={[
        { href: "/dashboard/maisons", label: "Maisons" },
        ...(maison
          ? [
              {
                href: `/dashboard/maisons/${encodeURIComponent(
                  maisonId(maison) || id
                )}`,
                label: "Détails",
              },
            ]
          : []),
        { label: "Modification" },
      ]}
    >
      {loading ? <MaisonEditSkeleton /> : null}

      {!loading && error && !values ? (
        <section className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-destructive">
          <h2 className="text-lg font-semibold">Maison introuvable</h2>
          <p className="mt-2 text-sm leading-6">{error}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/maisons">
                <ArrowLeft />
                Retour aux maisons
              </Link>
            </Button>
            <Button type="button" onClick={() => void loadEditData()}>
              <RefreshCw />
              Réessayer
            </Button>
          </div>
        </section>
      ) : null}

      {!loading && values ? (
        <>
          <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Modification de maison
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  {maison ? maisonDisplayName(maison) : "Maison"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Mettez à jour les informations principales et les
                  caractéristiques détaillées.
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="h-10 w-full lg:w-auto"
              >
                <Link
                  href={
                    maison
                      ? `/dashboard/maisons/${encodeURIComponent(
                          maisonId(maison) || id
                        )}`
                      : "/dashboard/maisons"
                  }
                >
                  <ArrowLeft />
                  Retour
                </Link>
              </Button>
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
                description="Données visibles dans la fiche de publication."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Titre *"
                    name="title"
                    value={values.title}
                    required
                    onChange={updateValue}
                  />
                  <div className="space-y-2">
                    <label className={labelClassName} htmlFor="agency_id">
                      Agence
                    </label>
                    <Select
                      value={values.agency_id}
                      onValueChange={(nextValue) =>
                        updateValue("agency_id", nextValue)
                      }
                    >
                      <SelectTrigger id="agency_id" className="h-10 w-full">
                        <SelectValue />
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
                    {agenciesError ? (
                      <p className="text-xs text-destructive">
                        {agenciesError}
                      </p>
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
                    <label className={labelClassName} htmlFor="description">
                      Description
                    </label>
                    <textarea
                      className={textAreaClassName}
                      id="description"
                      name="description"
                      value={values.description}
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
                    label="Maison active"
                    checked={values.is_active}
                    onChange={(checked) => updateBoolean("is_active", checked)}
                  />
                </div>
              </Section>

              <Section
                icon={MapPin}
                title="Adresse actuelle"
                description="Adresse actuellement rattachée à cette maison."
              >
                <p className="text-sm leading-6 text-muted-foreground">
                  {maison ? maisonAddressLabel(maison) : "-"}
                </p>
              </Section>

              <Section
                icon={FileImage}
                title="Images"
                description="Ajoutez des photos pour illustrer la fiche de la maison."
              >
                <div className="space-y-5">
                  {existingImages.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {existingImages.map((media, index) => (
                        <ImagePreview
                          key={String(media.id ?? index)}
                          media={media}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-md border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
                      Aucune image n&apos;est encore liée à cette maison.
                    </p>
                  )}

                  <label className="flex cursor-pointer flex-col gap-3 rounded-md border border-dashed border-border bg-background p-4 transition hover:border-primary/60 hover:bg-secondary/35 sm:flex-row sm:items-center">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                      <ImagePlus className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        Définir l&apos;image principale
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        Cette image sera prioritaire sur la fiche publique.
                      </span>
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        updateMainImage(event.target.files?.[0] ?? null)
                        event.target.value = ""
                      }}
                    />
                  </label>

                  {selectedMainImage ? (
                    <div className="max-w-md overflow-hidden rounded-md border border-border bg-muted">
                      <span
                        className="block aspect-video bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${selectedMainImage.previewUrl})`,
                        }}
                      />
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="min-w-0 truncate text-sm font-medium">
                          Image principale : {selectedMainImage.file.name}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-8 shrink-0"
                          onClick={() => updateMainImage(null)}
                          aria-label={`Retirer ${selectedMainImage.file.name}`}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <label className="flex cursor-pointer flex-col gap-3 rounded-md border border-dashed border-border bg-background p-4 transition hover:border-primary/60 hover:bg-secondary/35 sm:flex-row sm:items-center">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                      <ImagePlus className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        Ajouter des images à la galerie
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        Vous pouvez sélectionner plusieurs photos.
                      </span>
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(event) => {
                        updateImages(event.target.files)
                        event.target.value = ""
                      }}
                    />
                  </label>

                  {selectedImages.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {selectedImages.map((image, index) => (
                        <div
                          key={`${image.file.name}-${image.file.lastModified}-${index}`}
                          className="overflow-hidden rounded-md border border-border bg-muted"
                        >
                          <span
                            className="block aspect-video bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${image.previewUrl})`,
                            }}
                          />
                          <div className="flex items-center justify-between gap-2 px-3 py-2">
                            <span className="min-w-0 truncate text-sm font-medium">
                              {image.file.name}
                            </span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-8 shrink-0"
                              onClick={() => removeImageFile(index)}
                              aria-label={`Retirer ${image.file.name}`}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Section>

              <Section
                icon={Flame}
                title="Classification"
                description="Type de maison, standing, énergie, chauffage et isolation."
              >
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <SelectField
                    label="Type de maison"
                    name="home_type"
                    value={values.home_type}
                    options={homeTypeOptions}
                    onChange={updateValue}
                  />
                  <SelectField
                    label="Standing"
                    name="standing"
                    value={values.standing}
                    options={standingOptions}
                    onChange={updateValue}
                  />
                  <SelectField
                    label="Classe énergétique"
                    name="energy_class"
                    value={values.energy_class}
                    options={energyClassOptions}
                    onChange={updateValue}
                  />
                  <SelectField
                    label="Chauffage"
                    name="heating"
                    value={values.heating}
                    options={heatingOptions}
                    onChange={updateValue}
                  />
                  <SelectField
                    label="Isolation"
                    name="isolation"
                    value={values.isolation}
                    options={isolationOptions}
                    onChange={updateValue}
                  />
                  {compositionFields.map((field) => (
                    <TextField
                      key={field.name}
                      label={field.label}
                      name={field.name}
                      value={values[field.name]}
                      inputMode="numeric"
                      required={field.required}
                      onChange={updateValue}
                    />
                  ))}
                </div>
              </Section>

              <Section
                icon={Trees}
                title="Extérieurs et surfaces"
                description="Espaces extérieurs, garage, piscine et surfaces associées."
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {booleanFields.slice(0, 10).map((field) => (
                    <SwitchField
                      key={field.name}
                      label={field.label}
                      checked={Boolean(values[field.name])}
                      onChange={(checked) => updateBoolean(field.name, checked)}
                    />
                  ))}
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  {areaFields.map((field) => (
                    <TextField
                      key={field.name}
                      label={field.label}
                      name={field.name}
                      value={values[field.name]}
                      inputMode="decimal"
                      onChange={updateValue}
                    />
                  ))}
                  <TextField
                    label="Places garage"
                    name="place_number_garage"
                    value={values.place_number_garage}
                    inputMode="numeric"
                    onChange={updateValue}
                  />
                </div>
              </Section>

              <Section
                icon={ShieldCheck}
                title="Sécurité"
                description="Contrôle d’accès, surveillance et protection."
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {booleanFields.slice(10, 16).map((field) => (
                    <SwitchField
                      key={field.name}
                      label={field.label}
                      checked={Boolean(values[field.name])}
                      onChange={(checked) => updateBoolean(field.name, checked)}
                    />
                  ))}
                </div>
              </Section>

              <Section
                icon={KeyRound}
                title="Confort et prestige"
                description="Prestations avancées, état du bien et informations complémentaires."
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {booleanFields.slice(16).map((field) => (
                    <SwitchField
                      key={field.name}
                      label={field.label}
                      checked={Boolean(values[field.name])}
                      onChange={(checked) => updateBoolean(field.name, checked)}
                    />
                  ))}
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Architecte renommé"
                    name="renowned_architect"
                    value={values.renowned_architect}
                    onChange={updateValue}
                  />
                  <TextField
                    label="DPE"
                    name="dpe"
                    value={values.dpe}
                    onChange={updateValue}
                  />
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
                      Maison
                    </p>
                    <p className="mt-1 font-semibold">
                      {values.title.trim() || "-"}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {values.home_type} - {values.type_transaction}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Surface</p>
                      <p className="mt-1 font-medium">
                        {values.surface_habitable.trim() || "-"}
                      </p>
                    </div>
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Chambres</p>
                      <p className="mt-1 font-medium">
                        {values.chamber_number.trim() || "-"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Options activées
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedOptions.slice(0, 10).map((field) => (
                        <span
                          key={field.name}
                          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                        >
                          <CheckCircle2 className="size-3" />
                          {field.label}
                        </span>
                      ))}
                      {selectedOptions.length === 0 ? (
                        <span className="text-muted-foreground">Aucune.</span>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    className="h-10 w-full"
                    type="submit"
                    disabled={pending}
                  >
                    {pending ? <Loader2 className="animate-spin" /> : <Save />}
                    Enregistrer
                  </Button>
                </div>
              </div>
            </aside>
          </form>
        </>
      ) : null}
    </DashboardShell>
  )
}

export { MaisonEditContent }

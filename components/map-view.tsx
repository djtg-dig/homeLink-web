"use client"

type MapViewProps = {
  latitude?: number | string | null
  longitude?: number | string | null
  title: string
}

function toCoordinate(value?: number | string | null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsedValue = Number.parseFloat(value)

    return Number.isFinite(parsedValue) ? parsedValue : null
  }

  return null
}

function buildOpenStreetMapUrl(latitude: number, longitude: number) {
  const delta = 0.01
  const left = longitude - delta
  const right = longitude + delta
  const top = latitude + delta
  const bottom = latitude - delta

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left},${bottom},${right},${top}&layer=mapnik&marker=${latitude},${longitude}`
}

function buildOpenStreetMapDetailsUrl(latitude: number, longitude: number) {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`
}

export function MapView({ latitude, longitude, title }: MapViewProps) {
  const parsedLatitude = toCoordinate(latitude)
  const parsedLongitude = toCoordinate(longitude)

  if (parsedLatitude === null || parsedLongitude === null) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Localisation non disponible.
      </div>
    )
  }

  const mapUrl = buildOpenStreetMapUrl(parsedLatitude, parsedLongitude)
  const detailsUrl = buildOpenStreetMapDetailsUrl(
    parsedLatitude,
    parsedLongitude
  )

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="aspect-[16/10] w-full bg-muted">
        <iframe
          title={title}
          src={mapUrl}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
        <a
          href={detailsUrl}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Ouvrir dans OpenStreetMap
        </a>
      </div>
    </div>
  )
}

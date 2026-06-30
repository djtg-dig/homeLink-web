type GeocodingResult = {
  latitude: number | null
  longitude: number | null
}

type NominatimSearchResult = {
  lat?: string
  lon?: string
}

function parseCoordinate(value?: string) {
  if (!value) {
    return null
  }

  const parsedValue = Number.parseFloat(value)

  return Number.isFinite(parsedValue) ? parsedValue : null
}

export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  const normalizedAddress = address.trim()

  if (!normalizedAddress) {
    return {
      latitude: null,
      longitude: null,
    }
  }

  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      limit: "1",
      q: normalizedAddress,
    })

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    )

    if (!response.ok) {
      return {
        latitude: null,
        longitude: null,
      }
    }

    const results = (await response.json()) as NominatimSearchResult[]
    const firstResult = Array.isArray(results) ? results[0] : undefined

    return {
      latitude: parseCoordinate(firstResult?.lat),
      longitude: parseCoordinate(firstResult?.lon),
    }
  } catch {
    return {
      latitude: null,
      longitude: null,
    }
  }
}

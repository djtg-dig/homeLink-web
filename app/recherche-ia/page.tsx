import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { HouseAiResultsContent } from "@/components/home/house-ai-results-content"
import {
  houseAiFilterKeys,
  parseHouseAiFilterValue,
  type HouseAiFilters,
} from "@/lib/house-ai-search"

type HouseAiResultsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = {
  title: "Recherche de maisons | Homelink",
}

function searchParamValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key]

  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "")
}

export default async function HouseAiResultsPage({
  searchParams,
}: HouseAiResultsPageProps) {
  const params = (await searchParams) ?? {}
  const query = searchParamValue(params, "q").trim()

  if (!query) {
    redirect("/")
  }

  const filters: HouseAiFilters = {}

  houseAiFilterKeys.forEach((key) => {
    const value = searchParamValue(params, key)

    if (value) {
      filters[key] = parseHouseAiFilterValue(value)
    }
  })

  return (
    <HouseAiResultsContent
      key={`${query}-${JSON.stringify(filters)}`}
      query={query}
      filters={filters}
    />
  )
}

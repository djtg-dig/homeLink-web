import { HomeContent } from "@/components/home/home-content"
import type { PublicImmovableFilters } from "@/lib/public-immovables"

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function searchParamValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: keyof PublicImmovableFilters
) {
  const value = searchParams[key]

  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "")
}

export default async function Page({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {}
  const initialFilters = {
    city: searchParamValue(params, "city"),
    has_medias: searchParamValue(params, "has_medias"),
    max_price: searchParamValue(params, "max_price"),
    max_surface: searchParamValue(params, "max_surface"),
    min_price: searchParamValue(params, "min_price"),
    min_surface: searchParamValue(params, "min_surface"),
    neighborhood: searchParamValue(params, "neighborhood"),
    search: searchParamValue(params, "search"),
    sort_by: searchParamValue(params, "sort_by"),
    sort_order: searchParamValue(params, "sort_order"),
    statut: searchParamValue(params, "statut"),
    type_bien: searchParamValue(params, "type_bien"),
    type_transaction: searchParamValue(params, "type_transaction"),
  }

  return (
    <HomeContent
      key={JSON.stringify(initialFilters)}
      initialFilters={initialFilters}
    />
  )
}

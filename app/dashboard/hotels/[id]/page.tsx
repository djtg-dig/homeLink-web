import type { Metadata } from "next"

import { HotelDetailContent } from "@/components/hotels/hotel-detail-content"

type HotelDetailPageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    mode?: string
  }>
}

export const metadata: Metadata = {
  title: "Détails hôtel | Loyer360",
}

export default async function HotelDetailPage({
  params,
  searchParams,
}: HotelDetailPageProps) {
  const { id } = await params
  const { mode } = await searchParams

  return <HotelDetailContent id={id} startInEditMode={mode === "edit"} />
}

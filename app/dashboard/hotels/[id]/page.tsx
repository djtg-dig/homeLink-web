import type { Metadata } from "next"

import { HotelDetailContent } from "@/components/hotels/hotel-detail-content"

type HotelDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: "Détails hôtel | Loyer360",
}

export default async function HotelDetailPage({
  params,
}: HotelDetailPageProps) {
  const { id } = await params

  return <HotelDetailContent id={id} />
}

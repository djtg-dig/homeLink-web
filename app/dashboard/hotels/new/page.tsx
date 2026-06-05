import type { Metadata } from "next"

import { HotelCreateContent } from "@/components/hotels/hotel-create-content"

export const metadata: Metadata = {
  title: "Nouvel hôtel | Homelink",
}

export default function NewHotelPage() {
  return <HotelCreateContent />
}

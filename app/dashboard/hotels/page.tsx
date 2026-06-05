import type { Metadata } from "next"

import { HotelsContent } from "@/components/hotels/hotels-content"

export const metadata: Metadata = {
  title: "Hôtels | Homelink",
}

export default function HotelsPage() {
  return <HotelsContent />
}

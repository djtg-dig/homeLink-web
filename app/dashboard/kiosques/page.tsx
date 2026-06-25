import type { Metadata } from "next"

import { KiosquesContent } from "@/components/kiosques/kiosques-content"

export const metadata: Metadata = {
  title: "Kiosques | Loyer360",
}

export default function KiosquesPage() {
  return <KiosquesContent />
}

import type { Metadata } from "next"

import { KiosqueCreateContent } from "@/components/kiosques/kiosque-create-content"

export const metadata: Metadata = {
  title: "Nouveau kiosque | Loyer360",
}

export default function NewKiosquePage() {
  return <KiosqueCreateContent />
}

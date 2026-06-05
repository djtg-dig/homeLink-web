import type { Metadata } from "next"

import { KiosqueCreateContent } from "@/components/kiosques/kiosque-create-content"

export const metadata: Metadata = {
  title: "Nouveau kiosque | Homelink",
}

export default function NewKiosquePage() {
  return <KiosqueCreateContent />
}

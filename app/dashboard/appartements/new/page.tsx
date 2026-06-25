import type { Metadata } from "next"

import { AppartementCreateContent } from "@/components/appartements/appartement-create-content"

export const metadata: Metadata = {
  title: "Nouvel appartement | Loyer360",
}

export default function NewAppartementPage() {
  return <AppartementCreateContent />
}

import type { Metadata } from "next"

import { AppartementCreateContent } from "@/components/appartements/appartement-create-content"

export const metadata: Metadata = {
  title: "Nouvel appartement | Homelink",
}

export default function NewAppartementPage() {
  return <AppartementCreateContent />
}

import type { Metadata } from "next"

import { ImmeubleCreateContent } from "@/components/immeubles/immeuble-create-content"

export const metadata: Metadata = {
  title: "Nouvel immeuble | Loyer360",
}

export default function NewImmeublePage() {
  return <ImmeubleCreateContent />
}

import type { Metadata } from "next"

import { SalleEvenementCreateContent } from "@/components/salles-evenement/salle-evenement-create-content"

export const metadata: Metadata = {
  title: "Nouvelle salle événement | Homelink",
}

export default function NewSalleEvenementPage() {
  return <SalleEvenementCreateContent />
}

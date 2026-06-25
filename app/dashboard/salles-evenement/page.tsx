import type { Metadata } from "next"

import { SallesEvenementContent } from "@/components/salles-evenement/salles-evenement-content"

export const metadata: Metadata = {
  title: "Salles événement | Loyer360",
}

export default function SallesEvenementPage() {
  return <SallesEvenementContent />
}

import type { Metadata } from "next"

import { AgenciesListContent } from "@/components/agencies/agencies-list-content"

export const metadata: Metadata = {
  title: "Agences | Loyer360",
}

export default function AgenciesPage() {
  return <AgenciesListContent />
}

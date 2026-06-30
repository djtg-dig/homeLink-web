import type { Metadata } from "next"

import { PublicAgenciesContent } from "@/components/agencies/public-agencies-content"

export const metadata: Metadata = {
  title: "Agences immobilières | Loyer360",
}

export default function AgenciesPublicPage() {
  return <PublicAgenciesContent />
}

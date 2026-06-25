import type { Metadata } from "next"
import { Suspense } from "react"

import { PublicAgenciesContent } from "@/components/agencies/public-agencies-content"

export const metadata: Metadata = {
  title: "Agences immobilières | Loyer360",
}

export default function AgenciesPublicPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Chargement des agences...</div>}>
      <PublicAgenciesContent />
    </Suspense>
  )
}

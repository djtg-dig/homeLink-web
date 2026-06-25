import type { Metadata } from "next"

import { AgencyCreateContent } from "@/components/agencies/agency-create-content"

export const metadata: Metadata = {
  title: "Nouvelle agence | Loyer360",
}

export default function NewAgencyPage() {
  return <AgencyCreateContent />
}

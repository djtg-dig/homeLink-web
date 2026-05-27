import type { Metadata } from "next"

import { AgencyCreateContent } from "@/components/agencies/agency-create-content"

export const metadata: Metadata = {
  title: "Nouvelle agence | Homelink",
}

export default function NewAgencyPage() {
  return <AgencyCreateContent />
}

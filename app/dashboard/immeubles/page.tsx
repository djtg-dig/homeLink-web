import type { Metadata } from "next"

import { ImmeublesContent } from "@/components/immeubles/immeubles-content"

export const metadata: Metadata = {
  title: "Immeubles | Loyer360",
}

export default function ImmeublesPage() {
  return <ImmeublesContent />
}

import type { Metadata } from "next"

import { ImmeublesContent } from "@/components/immeubles/immeubles-content"

export const metadata: Metadata = {
  title: "Immeubles | Homelink",
}

export default function ImmeublesPage() {
  return <ImmeublesContent />
}

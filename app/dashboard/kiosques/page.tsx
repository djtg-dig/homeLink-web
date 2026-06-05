import type { Metadata } from "next"

import { KiosquesContent } from "@/components/kiosques/kiosques-content"

export const metadata: Metadata = {
  title: "Kiosques | Homelink",
}

export default function KiosquesPage() {
  return <KiosquesContent />
}

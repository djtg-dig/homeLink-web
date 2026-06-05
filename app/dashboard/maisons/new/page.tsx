import type { Metadata } from "next"

import { MaisonCreateContent } from "@/components/maisons/maison-create-content"

export const metadata: Metadata = {
  title: "Nouvelle maison | Homelink",
}

export default function NewMaisonPage() {
  return <MaisonCreateContent />
}

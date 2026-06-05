import type { Metadata } from "next"

import { MaisonsContent } from "@/components/maisons/maisons-content"

export const metadata: Metadata = {
  title: "Maisons | Homelink",
}

export default function MaisonsPage() {
  return <MaisonsContent />
}

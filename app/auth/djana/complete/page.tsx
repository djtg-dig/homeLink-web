import type { Metadata } from "next"

import { DjanaAuthComplete } from "@/components/auth/djana-auth-complete"

export const metadata: Metadata = {
  title: "Connexion Djana | Homelink",
}

export default function DjanaAuthCompletePage() {
  return <DjanaAuthComplete />
}

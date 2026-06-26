import type { Metadata } from "next"

import { DjanaAuthComplete } from "@/components/auth/djana-auth-complete"

export const metadata: Metadata = {
  title: "Connexion Djana | Loyer360",
  robots: {
    index: false,
    follow: false,
  },
}

export default function DjanaAuthCompletePage() {
  return <DjanaAuthComplete />
}

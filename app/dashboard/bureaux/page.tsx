import type { Metadata } from "next"

import { BureauxContent } from "@/components/bureaux/bureaux-content"

export const metadata: Metadata = {
  title: "Bureaux | Loyer360",
}

export default function BureauxPage() {
  return <BureauxContent />
}

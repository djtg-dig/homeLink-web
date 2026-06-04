import type { Metadata } from "next"

import { BureauxContent } from "@/components/bureaux/bureaux-content"

export const metadata: Metadata = {
  title: "Bureaux | Homelink",
}

export default function BureauxPage() {
  return <BureauxContent />
}

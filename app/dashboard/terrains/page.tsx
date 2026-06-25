import type { Metadata } from "next"

import { TerrainsContent } from "@/components/terrains/terrains-content"

export const metadata: Metadata = {
  title: "Terrains | Loyer360",
}

export default function TerrainsPage() {
  return <TerrainsContent />
}

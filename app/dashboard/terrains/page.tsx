import type { Metadata } from "next"

import { TerrainsContent } from "@/components/terrains/terrains-content"

export const metadata: Metadata = {
  title: "Terrains | Homelink",
}

export default function TerrainsPage() {
  return <TerrainsContent />
}

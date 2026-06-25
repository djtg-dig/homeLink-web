import type { Metadata } from "next"

import { TerrainCreateContent } from "@/components/terrains/terrain-create-content"

export const metadata: Metadata = {
  title: "Nouveau terrain | Loyer360",
}

export default function NewTerrainPage() {
  return <TerrainCreateContent />
}

import type { Metadata } from "next"

import { TerrainCreateContent } from "@/components/terrains/terrain-create-content"

export const metadata: Metadata = {
  title: "Nouveau terrain | Homelink",
}

export default function NewTerrainPage() {
  return <TerrainCreateContent />
}

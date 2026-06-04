import type { Metadata } from "next"

import { BureauCreateContent } from "@/components/bureaux/bureau-create-content"

export const metadata: Metadata = {
  title: "Nouveau bureau | Homelink",
}

export default function NewBureauPage() {
  return <BureauCreateContent />
}

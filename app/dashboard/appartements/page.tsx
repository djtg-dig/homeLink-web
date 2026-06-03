import type { Metadata } from "next"

import { AppartementsContent } from "@/components/appartements/appartements-content"

export const metadata: Metadata = {
  title: "Appartements | Homelink",
}

export default function AppartementsPage() {
  return <AppartementsContent />
}

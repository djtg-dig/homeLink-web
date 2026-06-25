import type { Metadata } from "next"

import { MaisonEditContent } from "@/components/maisons/maison-edit-content"

type MaisonEditPageProps = {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: "Modifier maison | Loyer360",
}

export default async function MaisonEditPage({ params }: MaisonEditPageProps) {
  const { id } = await params

  return <MaisonEditContent id={id} />
}

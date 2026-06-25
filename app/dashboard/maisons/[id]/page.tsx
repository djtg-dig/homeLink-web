import type { Metadata } from "next"

import { MaisonDetailContent } from "@/components/maisons/maison-detail-content"

type MaisonDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: "Détails maison | Loyer360",
}

export default async function MaisonDetailPage({
  params,
}: MaisonDetailPageProps) {
  const { id } = await params

  return <MaisonDetailContent id={id} />
}

import type { Metadata } from "next"

import { AppartementDetailContent } from "@/components/appartements/appartement-detail-content"

type AppartementDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: "Détails appartement | Loyer360",
}

export default async function AppartementDetailPage({
  params,
}: AppartementDetailPageProps) {
  const { id } = await params

  return <AppartementDetailContent id={id} />
}

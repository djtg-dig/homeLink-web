import type { Metadata } from "next"

import { KiosqueDetailContent } from "@/components/kiosques/kiosque-detail-content"

type KiosqueDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: "Détails kiosque | Loyer360",
}

export default async function KiosqueDetailPage({
  params,
}: KiosqueDetailPageProps) {
  const { id } = await params

  return <KiosqueDetailContent id={id} />
}

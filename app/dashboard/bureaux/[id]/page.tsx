import type { Metadata } from "next"

import { BureauDetailContent } from "@/components/bureaux/bureau-detail-content"

type BureauDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: "Détails bureau | Loyer360",
}

export default async function BureauDetailPage({
  params,
}: BureauDetailPageProps) {
  const { id } = await params

  return <BureauDetailContent id={id} />
}

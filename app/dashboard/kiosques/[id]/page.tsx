import type { Metadata } from "next"

import { KiosqueDetailContent } from "@/components/kiosques/kiosque-detail-content"

type KiosqueDetailPageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    mode?: string
  }>
}

export const metadata: Metadata = {
  title: "Détails kiosque | Loyer360",
}

export default async function KiosqueDetailPage({
  params,
  searchParams,
}: KiosqueDetailPageProps) {
  const { id } = await params
  const { mode } = await searchParams

  return <KiosqueDetailContent id={id} startInEditMode={mode === "edit"} />
}

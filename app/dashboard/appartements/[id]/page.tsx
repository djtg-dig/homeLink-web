import type { Metadata } from "next"

import { AppartementDetailContent } from "@/components/appartements/appartement-detail-content"

type AppartementDetailPageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    mode?: string
  }>
}

export const metadata: Metadata = {
  title: "Détails appartement | Loyer360",
}

export default async function AppartementDetailPage({
  params,
  searchParams,
}: AppartementDetailPageProps) {
  const { id } = await params
  const { mode } = await searchParams

  return (
    <AppartementDetailContent id={id} startInEditMode={mode === "edit"} />
  )
}

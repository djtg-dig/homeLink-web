import type { Metadata } from "next"

import { AgencyDetailContent } from "@/components/agencies/agency-detail-content"

type AgencyDetailPageProps = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    mode?: string
  }>
}

export const metadata: Metadata = {
  title: "Détails agence | Loyer360",
}

export default async function AgencyDetailPage({
  params,
  searchParams,
}: AgencyDetailPageProps) {
  const { slug } = await params
  const { mode } = await searchParams

  return (
    <AgencyDetailContent slug={slug} startInEditMode={mode === "edit"} />
  )
}

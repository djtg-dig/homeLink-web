import type { Metadata } from "next"

import { AgencyDetailContent } from "@/components/agencies/agency-detail-content"

type AgencyDetailPageProps = {
  params: Promise<{
    slug: string
  }>
}

export const metadata: Metadata = {
  title: "Détails agence | Homelink",
}

export default async function AgencyDetailPage({
  params,
}: AgencyDetailPageProps) {
  const { slug } = await params

  return <AgencyDetailContent slug={slug} />
}

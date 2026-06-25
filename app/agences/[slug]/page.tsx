import type { Metadata } from "next"

import { PublicAgencyDetailContent } from "@/components/agencies/public-agency-detail-content"

type PublicAgencyDetailPageProps = {
  params: Promise<{
    slug: string
  }>
}

export const metadata: Metadata = {
  title: "Détail agence | Homelink",
}

export default async function PublicAgencyDetailPage({
  params,
}: PublicAgencyDetailPageProps) {
  const { slug } = await params

  return <PublicAgencyDetailContent slug={slug} />
}

import type { Metadata } from "next"
import { Suspense } from "react"

import { PublicAgencyDetailContent } from "@/components/agencies/public-agency-detail-content"

type PublicAgencyDetailPageProps = {
  params: Promise<{
    slug: string
  }>
}

export const metadata: Metadata = {
  title: "Détail agence | Loyer360",
}

export default async function PublicAgencyDetailPage({
  params,
}: PublicAgencyDetailPageProps) {
  const { slug } = await params

  return (
    <Suspense
      fallback={<div className="p-6 text-sm">Chargement de l&apos;agence...</div>}
    >
      <PublicAgencyDetailContent slug={slug} />
    </Suspense>
  )
}

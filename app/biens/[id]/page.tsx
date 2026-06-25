import type { Metadata } from "next"

import { PublicPropertyDetailContent } from "@/components/home/public-property-detail-content"

type PublicPropertyPageProps = {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: "Bien immobilier | Loyer360",
}

export default async function PublicPropertyPage({
  params,
}: PublicPropertyPageProps) {
  const { id } = await params

  return <PublicPropertyDetailContent id={id} />
}

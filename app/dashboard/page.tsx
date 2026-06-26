import type { Metadata } from "next"

import { DashboardContent } from "@/components/dashboard/dashboard-content"

export const metadata: Metadata = {
  title: "Dashboard | Loyer360",
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardPage() {
  return <DashboardContent />
}

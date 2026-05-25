import type { Metadata } from "next"

import { DashboardContent } from "@/components/dashboard/dashboard-content"

export const metadata: Metadata = {
  title: "Dashboard | Homelink",
}

export default function DashboardPage() {
  return <DashboardContent />
}

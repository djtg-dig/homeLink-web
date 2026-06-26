import type { MetadataRoute } from "next"

const baseUrl = "https://loyer360.com"

const publicStaticRoutes = [
  {
    path: "/",
    changeFrequency: "daily" as const,
    priority: 1,
  },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return publicStaticRoutes.map((route) => ({
    url: new URL(route.path, baseUrl).toString(),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}

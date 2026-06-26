import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/login", "/register", "/auth/"],
      },
    ],
    sitemap: "https://loyer360.com/sitemap.xml",
  }
}

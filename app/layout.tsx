import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { NetworkErrorScreen } from "@/components/ui/network-error-screen"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://loyer360.com"),
  title: {
    default: "Loyer360 | Biens immobiliers à vendre et à louer",
    template: "%s | Loyer360",
  },
  description:
    "Trouvez des maisons, appartements, terrains, bureaux, hôtels, kiosques et salles événement à vendre ou à louer avec Loyer360.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://loyer360.com",
    siteName: "Loyer360",
    title: "Loyer360 | Biens immobiliers à vendre et à louer",
    description:
      "Explorez les biens immobiliers disponibles et trouvez rapidement le bien adapté à vos besoins.",
    images: [
      {
        url: "/logo.png",
        width: 1536,
        height: 1024,
        alt: "Loyer360 - plateforme immobilière",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Loyer360 | Biens immobiliers à vendre et à louer",
    description:
      "Maisons, appartements, terrains, bureaux et autres biens immobiliers disponibles sur Loyer360.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider>
          {children}
          <NetworkErrorScreen />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

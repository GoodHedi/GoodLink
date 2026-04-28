import type { Metadata, Viewport } from "next"
import {
  DM_Serif_Display,
  Inter,
  JetBrains_Mono,
  Space_Grotesk
} from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
})

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-serif",
  display: "swap"
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GoodLink — Un seul lien pour tout partager",
    template: "%s · GoodLink"
  },
  description:
    "Crée ta page de liens en quelques secondes. Avatar, bio, et tous tes liens — un seul URL à partager.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "GoodLink"
  },
  twitter: { card: "summary_large_image" }
}

export const viewport: Viewport = {
  themeColor: "#0F291E",
  width: "device-width",
  initialScale: 1
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${dmSerif.variable} ${jetBrainsMono.variable} ${spaceGrotesk.variable}`}
    >
      <body className="font-sans">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}

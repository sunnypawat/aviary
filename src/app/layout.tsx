import type { Metadata, Viewport } from "next"
import "./globals.css"
import { SwRegister } from "@/components/sw-register"

export const metadata: Metadata = {
  title: "Aviary",
  description: "Letterboxd for Birds — log, rate, and share your sightings",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aviary",
  },
}

export const viewport: Viewport = {
  themeColor: "#2d6a4f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <SwRegister />
      </body>
    </html>
  )
}

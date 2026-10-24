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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <SwRegister />
      </body>
    </html>
  )
}

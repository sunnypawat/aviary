"use client"

import { useEffect, useRef } from "react"

type Point = {
  id: string
  lat: number
  lng: number
  speciesName: string
  commonName?: string | null
}

export function SightingsMap({ points }: { points: Point[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import("leaflet").Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import("leaflet").then((L) => {
      // Fix default marker icon paths broken by bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      if (!containerRef.current) return

      const map = L.map(containerRef.current, { scrollWheelZoom: false })
      mapRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      const markers = points.map((p) =>
        L.marker([p.lat, p.lng]).bindPopup(
          `<strong>${p.commonName ?? p.speciesName}</strong>${p.commonName ? `<br><em>${p.speciesName}</em>` : ""}`
        )
      )

      if (markers.length > 0) {
        const group = L.featureGroup(markers).addTo(map)
        map.fitBounds(group.getBounds().pad(0.2))
      } else {
        map.setView([20, 0], 2)
      }
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [points])

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={containerRef} className="w-full h-72 rounded-xl border border-gray-200 z-0" />
    </>
  )
}

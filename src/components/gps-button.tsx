"use client"

import { useState } from "react"

export function GpsButton({
  onLocation,
}: {
  onLocation: (lat: number, lng: number, locationName?: string) => void
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")

  async function locate() {
    if (!navigator.geolocation) { setState("error"); return }
    setState("loading")
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        let locationName: string | undefined

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          )
          const data = await res.json()
          const a = data.address ?? {}
          // Build a human-readable name from most-specific to least
          locationName = [
            a.nature_reserve ?? a.park ?? a.leisure,
            a.suburb ?? a.neighbourhood ?? a.village ?? a.town ?? a.city,
            a.state ?? a.county,
            a.country_code?.toUpperCase(),
          ]
            .filter(Boolean)
            .join(", ") || data.display_name?.split(",").slice(0, 2).join(",").trim()
        } catch {
          // geocoding failed — still set coords
        }

        onLocation(lat, lng, locationName)
        setState("done")
      },
      () => setState("error"),
      { timeout: 8000 }
    )
  }

  return (
    <button
      type="button"
      onClick={locate}
      disabled={state === "loading"}
      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 border transition-colors disabled:opacity-50 ${
        state === "done"
          ? "border-black text-black bg-gray-50"
          : state === "error"
          ? "border-black text-red-600"
          : "border-black text-black hover:bg-gray-50"
      }`}
    >
      {state === "loading" ? "Locating…" : state === "done" ? "📍 Got location" : state === "error" ? "Location denied" : "📍 Use my location"}
    </button>
  )
}

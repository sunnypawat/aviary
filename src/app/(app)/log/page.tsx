"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { logSighting } from "@/lib/actions/sightings"
import { StarRating } from "@/components/star-rating"
import { PhotoUpload } from "@/components/photo-upload"
import { SpeciesAutocomplete } from "@/components/species-autocomplete"
import { BirdNetRecorder } from "@/components/birdnet-recorder"
import { GpsButton } from "@/components/gps-button"
import { saveDraft } from "@/lib/drafts"

const initialState = { error: "", success: false as boolean }

export default function LogPage() {
  const [state, action, pending] = useActionState(logSighting, initialState)
  const router = useRouter()
  const [speciesKey, setSpeciesKey] = useState(0)
  const [prefilledSci, setPrefilledSci] = useState("")
  const [prefilledCom, setPrefilledCom] = useState("")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [locationName, setLocationName] = useState("")
  const [savedOffline, setSavedOffline] = useState(false)
  const [mode, setMode] = useState<"quick" | "full">("quick")

  useEffect(() => {
    if (state?.success) router.push("/feed")
  }, [state?.success, router])

  function handleBirdNetSelect(sciName: string, comName: string) {
    setPrefilledSci(sciName)
    setPrefilledCom(comName)
    setSpeciesKey((k) => k + 1)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (navigator.onLine) return
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data: Record<string, string> = {}
    for (const [k, v] of fd.entries()) {
      if (typeof v === "string") data[k] = v
    }
    saveDraft(data).then(() => {
      window.dispatchEvent(new Event("aviary:draft-saved"))
      setSavedOffline(true)
    })
  }

  if (savedOffline) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="text-5xl mb-4">📋</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Saved offline</h2>
        <p className="text-sm text-gray-500 mb-6">
          Your sighting is stored on this device. It will sync automatically when you&apos;re back online.
        </p>
        <button onClick={() => setSavedOffline(false)} className="text-sm text-green-700 hover:underline">
          Log another sighting
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Log a Sighting</h1>
        {/* Mode toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setMode("quick")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              mode === "quick" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            ⚡ Quick
          </button>
          <button
            type="button"
            onClick={() => setMode("full")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              mode === "full" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Full
          </button>
        </div>
      </div>

      {mode === "quick" && (
        <p className="text-sm text-gray-500 mb-4">
          Just the essentials — species and rating. Add more details in full mode.
        </p>
      )}

      <form action={action} onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-5">
        <SpeciesAutocomplete key={speciesKey} initialSciName={prefilledSci} initialComName={prefilledCom} />

        {mode === "quick" && <BirdNetRecorder onSelect={handleBirdNetSelect} />}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating <span className="text-red-500">*</span>
          </label>
          <StarRating name="rating" />
        </div>

        {/* Quick mode: hidden defaults for required fields */}
        {mode === "quick" && (
          <>
            <input type="hidden" name="sightedAt" value={new Date().toISOString().split("T")[0]} />
            <input type="hidden" name="visibility" value="public" />
          </>
        )}

        {/* Full mode: all fields */}
        {mode === "full" && (
          <>
            <BirdNetRecorder onSelect={handleBirdNetSelect} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date sighted</label>
              <input
                name="sightedAt"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location name</label>
              <input
                name="locationName"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Djurgården, Stockholm"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Coordinates</label>
                <GpsButton onLocation={(la, ln, name) => { setLat(la.toFixed(6)); setLng(ln.toFixed(6)); if (name) setLocationName(name) }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="lat"
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="Latitude"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  name="lng"
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="Longitude"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Exact coordinates stored privately. Only ~10 km region shared publicly.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
              <PhotoUpload />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field notes</label>
              <textarea
                name="notes"
                rows={4}
                placeholder="Describe the encounter, behavior, plumage…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <select
                name="visibility"
                defaultValue="public"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="public">🌍 Public — visible on Fediverse</option>
                <option value="friends">👥 Friends only</option>
                <option value="private">🔒 Private</option>
              </select>
            </div>
          </>
        )}

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg py-2.5 text-sm transition-colors disabled:opacity-60 active:scale-[0.99]"
        >
          {pending ? "Saving…" : mode === "quick" ? "⚡ Quick save" : "Save Sighting"}
        </button>

        {mode === "quick" && (
          <button
            type="button"
            onClick={() => setMode("full")}
            className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
          >
            Add location, photos, notes →
          </button>
        )}
      </form>
    </div>
  )
}

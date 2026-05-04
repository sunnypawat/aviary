"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { updateSighting } from "@/lib/actions/sightings"
import { StarRating } from "@/components/star-rating"
import { SpeciesAutocomplete } from "@/components/species-autocomplete"
import type { Sighting } from "@/lib/db/schema"

const initialState = { error: "", success: false as boolean }

export function EditSightingForm({ sighting }: { sighting: Sighting }) {
  const [state, action, pending] = useActionState(updateSighting, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) router.push("/feed")
  }, [state?.success, router])

  return (
    <form action={action} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <input type="hidden" name="sightingId" value={sighting.id} />

      <SpeciesAutocomplete
        initialSciName={sighting.speciesName}
        initialComName={sighting.commonName ?? ""}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating <span className="text-red-500">*</span>
        </label>
        <StarRating name="rating" defaultValue={sighting.rating} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date sighted
        </label>
        <input
          name="sightedAt"
          type="date"
          defaultValue={new Date(sighting.sightedAt).toISOString().split("T")[0]}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location name
        </label>
        <input
          name="locationName"
          type="text"
          defaultValue={sighting.locationName ?? ""}
          placeholder="e.g. Central Park, NYC"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
          <input
            name="lat"
            type="number"
            step="any"
            defaultValue={sighting.latExact ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
          <input
            name="lng"
            type="number"
            step="any"
            defaultValue={sighting.lngExact ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400 -mt-3">
        Exact coordinates are stored privately. Only a ~10 km region is shared publicly.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Field notes</label>
        <textarea
          name="notes"
          rows={4}
          defaultValue={sighting.notes ?? ""}
          placeholder="Describe the encounter, behavior, plumage…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
        <select
          name="visibility"
          defaultValue={sighting.visibility}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="public">Public</option>
          <option value="friends">Friends only</option>
          <option value="private">Private</option>
        </select>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 border border-gray-300 text-gray-700 font-medium rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg py-2 text-sm transition-colors disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  )
}

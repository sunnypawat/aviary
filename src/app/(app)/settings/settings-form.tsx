"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { updateProfile, deleteAccount } from "@/lib/actions/profile"
import { useLowBandwidth } from "@/components/low-bandwidth-provider"

const initialState = { error: "", success: false as boolean }

export function SettingsForm({
  currentName,
  currentBio,
  username,
}: {
  currentName: string
  currentBio: string
  username: string
}) {
  const [state, action, pending] = useActionState(updateProfile, initialState)
  const router = useRouter()
  const { enabled: lowBandwidth, toggle: toggleLowBandwidth } = useLowBandwidth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  async function handleDelete() {
    if (!confirm("Permanently delete your account and all sightings? This cannot be undone.")) return
    await deleteAccount()
    router.push("/login")
  }

  return (
    <div className="space-y-5">
      {/* Profile */}
      <form action={action} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
        <h2 className="text-base font-semibold text-gray-800">Edit Profile</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">@{username}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
          <input
            name="name"
            type="text"
            defaultValue={currentName}
            placeholder="Your name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            name="bio"
            rows={3}
            defaultValue={currentBio}
            placeholder="A few words about yourself and your birding…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.success && <p className="text-sm text-green-700">Profile updated.</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg py-2.5 text-sm transition-colors disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>

      {/* Permacomputing */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">🌿 Data &amp; efficiency</h2>
          <p className="text-xs text-gray-400 mt-0.5">Your data belongs to you. Keep it light.</p>
        </div>

        {/* Low-bandwidth toggle */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Low-bandwidth mode</p>
            <p className="text-xs text-gray-400 mt-0.5">Hides photos in feeds — saves data on slow connections</p>
          </div>
          {mounted && (
            <button
              type="button"
              onClick={toggleLowBandwidth}
              role="switch"
              aria-checked={lowBandwidth}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                lowBandwidth ? "bg-green-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  lowBandwidth ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          )}
        </div>

        {/* Export data */}
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Export your data</p>
          <p className="text-xs text-gray-400">Download a complete archive of everything you've logged.</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <a
              href="/api/export/all"
              download
              className="text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              ↓ Full archive (JSON)
            </a>
            <a
              href="/api/export/lifelist"
              download
              className="text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              ↓ Lifelist (eBird CSV)
            </a>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-200 p-5">
        <h2 className="text-base font-semibold text-red-700 mb-2">Danger zone</h2>
        <p className="text-sm text-gray-500 mb-4">Deleting your account removes all sightings, lists, and followers permanently.</p>
        <button
          type="button"
          onClick={handleDelete}
          className="text-sm text-red-600 border border-red-300 rounded-lg px-4 py-2 hover:bg-red-50 transition-colors"
        >
          Delete account
        </button>
      </div>
    </div>
  )
}

"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { updateProfile, deleteAccount } from "@/lib/actions/profile"
import { useLowBandwidth } from "@/components/low-bandwidth-provider"

const initialState = { error: "", success: false as boolean }

const inputCls = "w-full border border-black px-3 py-2 text-sm bg-white focus:outline-none focus:outline-2 focus:outline-[#1a3a2a]"
const labelCls = "block text-sm font-medium text-black mb-1"

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

      {/* ── Profile ── */}
      <form action={action} className="border-2 border-black p-5 space-y-5">
        <h2 className="text-base font-bold text-black">Edit Profile</h2>

        <div>
          <label className={labelCls}>Username</label>
          <p className="text-sm text-gray-600 border border-black px-3 py-2 bg-[#fafaf8]">@{username}</p>
        </div>

        <div>
          <label className={labelCls}>Display name</label>
          <input name="name" type="text" defaultValue={currentName} placeholder="Your name" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Bio</label>
          <textarea
            name="bio"
            rows={3}
            defaultValue={currentBio}
            placeholder="A few words about yourself and your birding…"
            className={`${inputCls} resize-none`}
          />
        </div>

        {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
        {state?.success && <p className="text-sm text-[#1a3a2a]">Profile updated.</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full border-2 border-black bg-black hover:bg-[#1a3a2a] hover:border-[#1a3a2a] text-white font-medium py-2.5 text-sm transition-colors disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>

      {/* ── Data & efficiency ── */}
      <div className="border-2 border-black p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-black">🌿 Data &amp; efficiency</h2>
          <p className="text-xs text-gray-500 mt-0.5">Your data belongs to you. Keep it light.</p>
        </div>

        {/* Low-bandwidth toggle */}
        <div className="flex items-center justify-between gap-4 border-t border-black pt-4">
          <div>
            <p className="text-sm font-medium text-black">Low-bandwidth mode</p>
            <p className="text-xs text-gray-500 mt-0.5">Hides photos in feeds — saves data on slow connections</p>
          </div>
          {mounted && (
            <button
              type="button"
              onClick={toggleLowBandwidth}
              role="switch"
              aria-checked={lowBandwidth}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center border-2 border-black transition-colors focus:outline-none ${
                lowBandwidth ? "bg-black" : "bg-[#fafaf8]"
              }`}
            >
              <span
                className={`inline-block h-3 w-3 border border-black bg-white transition-transform ${
                  lowBandwidth ? "translate-x-5 bg-white" : "translate-x-1"
                }`}
              />
            </button>
          )}
        </div>

        {/* Export data */}
        <div className="border-t border-black pt-4 space-y-2">
          <p className="text-sm font-medium text-black">Export your data</p>
          <p className="text-xs text-gray-500">Download a complete archive of everything you&apos;ve logged.</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <a
              href="/api/export/all"
              download
              className="text-sm border-2 border-black text-black hover:bg-black hover:text-white px-3 py-1.5 transition-colors"
            >
              ↓ Full archive (JSON)
            </a>
            <a
              href="/api/export/lifelist"
              download
              className="text-sm border-2 border-black text-black hover:bg-black hover:text-white px-3 py-1.5 transition-colors"
            >
              ↓ Lifelist (eBird CSV)
            </a>
          </div>
        </div>
      </div>

      {/* ── Danger zone ── */}
      <div className="border-2 border-black p-5">
        <h2 className="text-base font-bold text-black mb-2">Danger zone</h2>
        <p className="text-sm text-gray-500 mb-4">Deleting your account removes all sightings, lists, and followers permanently.</p>
        <button
          type="button"
          onClick={handleDelete}
          className="text-sm text-red-700 border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
        >
          Delete account
        </button>
      </div>
    </div>
  )
}

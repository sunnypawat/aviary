"use client"

import { useEffect, useState, useCallback } from "react"
import { getDrafts, deleteDraft, type Draft } from "@/lib/drafts"

export function DraftsBanner() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [syncing, setSyncing] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const refresh = useCallback(async () => {
    setDrafts(await getDrafts())
    setDismissed(false)
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener("online", refresh)
    window.addEventListener("aviary:draft-saved", refresh)
    return () => {
      window.removeEventListener("online", refresh)
      window.removeEventListener("aviary:draft-saved", refresh)
    }
  }, [refresh])

  async function syncAll() {
    setSyncing(true)
    for (const draft of drafts) {
      try {
        const fd = new FormData()
        for (const [k, v] of Object.entries(draft.data)) fd.append(k, v)
        const res = await fetch("/api/sightings", { method: "POST", body: fd })
        if (res.ok) await deleteDraft(draft.id)
      } catch {
        // stay in queue, try again later
      }
    }
    setSyncing(false)
    refresh()
  }

  if (drafts.length === 0 || dismissed) return null

  return (
    <div className="border-b-2 border-black px-4 py-3 bg-[#fafaf8]">
      <div className="mx-auto max-w-3xl flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-black">
          📋 {drafts.length} offline {drafts.length === 1 ? "draft" : "drafts"} waiting to sync
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={syncAll}
            disabled={syncing || !navigator.onLine}
            className="text-xs font-medium border-2 border-black bg-black hover:bg-[#1a3a2a] text-white px-3 py-1.5 disabled:opacity-50 transition-colors"
          >
            {syncing ? "Syncing…" : navigator.onLine ? "Sync now" : "Offline"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-gray-500 hover:text-black px-2 py-1.5"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}

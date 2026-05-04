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
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="mx-auto max-w-3xl flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-amber-800">
          📋 {drafts.length} offline {drafts.length === 1 ? "draft" : "drafts"} waiting to sync
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={syncAll}
            disabled={syncing || !navigator.onLine}
            className="text-xs font-medium bg-amber-700 hover:bg-amber-800 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {syncing ? "Syncing…" : navigator.onLine ? "Sync now" : "Offline"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-amber-600 hover:text-amber-800 px-2 py-1.5"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}

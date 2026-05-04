"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteSighting } from "@/lib/actions/sightings"
import { addToList } from "@/lib/actions/lists"

type List = { id: string; name: string }

export function SightingActions({
  sightingId,
  lists,
}: {
  sightingId: string
  lists: List[]
}) {
  const [open, setOpen] = useState(false)
  const [showLists, setShowLists] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState("")
  const router = useRouter()

  function handleDelete() {
    if (!confirm("Delete this sighting?")) return
    startTransition(async () => {
      await deleteSighting(sightingId)
      router.refresh()
    })
  }

  function handleAddToList(listId: string, listName: string) {
    startTransition(async () => {
      const result = await addToList(listId, sightingId)
      if (result?.error) {
        setMessage(result.error)
      } else {
        setMessage(`Added to "${listName}"`)
        setTimeout(() => setMessage(""), 2000)
      }
      setOpen(false)
      setShowLists(false)
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((o) => !o); setShowLists(false) }}
        className="text-gray-300 hover:text-gray-500 px-1 rounded text-lg leading-none"
        aria-label="Sighting options"
      >
        ···
      </button>

      {message && (
        <span className="absolute right-0 -top-6 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded whitespace-nowrap">
          {message}
        </span>
      )}

      {open && (
        <div className="absolute right-0 top-7 z-10 bg-white border border-gray-200 rounded-lg shadow-lg w-44 py-1 text-sm">
          {!showLists ? (
            <>
              <button
                onClick={() => { setOpen(false); router.push(`/log/${sightingId}/edit`) }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
              >
                Edit sighting
              </button>
              <button
                onClick={() => setShowLists(true)}
                disabled={isPending || lists.length === 0}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 disabled:text-gray-300"
              >
                {lists.length === 0 ? "No lists yet" : "Add to list…"}
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 disabled:opacity-50"
              >
                Delete sighting
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowLists(false)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-400 text-xs"
              >
                ← Back
              </button>
              {lists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => handleAddToList(l.id, l.name)}
                  disabled={isPending}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 truncate disabled:opacity-50"
                >
                  {l.name}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useTransition } from "react"
import { removeFromList } from "@/lib/actions/lists"

export function RemoveFromListButton({ listItemId }: { listItemId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleRemove() {
    startTransition(async () => {
      await removeFromList(listItemId)
    })
  }

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      className="text-gray-300 hover:text-red-400 text-xs transition-colors disabled:opacity-40"
      aria-label="Remove from list"
    >
      ✕
    </button>
  )
}

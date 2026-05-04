"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { likeSighting, unlikeSighting } from "@/lib/actions/likes"

export function LikeButton({
  sightingId,
  liked,
  count,
}: {
  sightingId: string
  liked: boolean
  count: number
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      if (liked) {
        await unlikeSighting(sightingId)
      } else {
        await likeSighting(sightingId)
      }
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50 ${
        liked ? "text-red-500" : "text-gray-400 hover:text-red-400"
      }`}
    >
      {liked ? "♥" : "♡"} {count > 0 && count}
    </button>
  )
}

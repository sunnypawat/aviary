"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { followUser, unfollowUser } from "@/lib/actions/follows"

export function FollowButton({
  targetUserId,
  isFollowing,
}: {
  targetUserId: string
  isFollowing: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      if (isFollowing) {
        await unfollowUser(targetUserId)
      } else {
        await followUser(targetUserId)
      }
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
        isFollowing
          ? "border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
          : "bg-green-700 hover:bg-green-800 text-white"
      }`}
    >
      {isPending ? "…" : isFollowing ? "Following" : "Follow"}
    </button>
  )
}

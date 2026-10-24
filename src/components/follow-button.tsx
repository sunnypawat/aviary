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
      className={`px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        isFollowing
          ? "border-2 border-black text-black hover:bg-black hover:text-white"
          : "border-2 border-black bg-black text-white hover:bg-[#1a3a2a] hover:border-[#1a3a2a]"
      }`}
    >
      {isPending ? "…" : isFollowing ? "Following" : "Follow"}
    </button>
  )
}

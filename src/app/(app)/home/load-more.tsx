"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { LikeButton } from "@/components/like-button"
import { useLowBandwidth } from "@/components/low-bandwidth-provider"
import type { SightingPhoto } from "@/lib/db/schema"

type HomeItem = {
  id: string
  speciesName: string
  commonName: string | null
  rating: number
  notes: string | null
  locationName: string | null
  sightedAt: Date
  authorName: string | null
  authorUsername: string | null
}

export function HomeLoadMore({
  initialItems,
  initialPhotosBySighting,
  initialLikesBySighting,
  initialLikedByMe,
  initialNextCursor,
}: {
  initialItems: HomeItem[]
  initialPhotosBySighting: Record<string, SightingPhoto[]>
  initialLikesBySighting: Record<string, number>
  initialLikedByMe: string[]
  initialNextCursor: string | null
}) {
  const [items, setItems] = useState(initialItems)
  const [photosBySighting, setPhotosBySighting] = useState(initialPhotosBySighting)
  const [likesBySighting, setLikesBySighting] = useState(initialLikesBySighting)
  const [likedByMe, setLikedByMe] = useState(new Set(initialLikedByMe))
  const [cursor, setCursor] = useState(initialNextCursor)
  const [isPending, startTransition] = useTransition()
  const { enabled: lowBandwidth } = useLowBandwidth()

  function loadMore() {
    if (!cursor) return
    startTransition(async () => {
      const res = await fetch(`/api/home?cursor=${encodeURIComponent(cursor)}`)
      const data = await res.json()
      setItems((prev) => [...prev, ...data.items])
      setPhotosBySighting((prev) => {
        const next = { ...prev }
        for (const p of data.photos as SightingPhoto[]) {
          next[p.sightingId] = [...(next[p.sightingId] ?? []), p]
        }
        return next
      })
      setLikesBySighting((prev) => {
        const next = { ...prev }
        for (const l of data.likeCounts as { sightingId: string; count: number }[]) {
          next[l.sightingId] = Number(l.count)
        }
        return next
      })
      setLikedByMe((prev) => {
        const next = new Set(prev)
        for (const l of data.myLikes as { sightingId: string }[]) next.add(l.sightingId)
        return next
      })
      setCursor(data.nextCursor)
    })
  }

  return (
    <div className="space-y-3">
      {items.map((s) => {
        const sPhotos = (photosBySighting[s.id] ?? []).sort((a, b) => a.position - b.position)
        const likeCount = likesBySighting[s.id] ?? 0
        const liked = likedByMe.has(s.id)
        return (
          <article key={s.id} className="border border-black overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Link
                  href={`/profile/${s.authorUsername}`}
                  className="w-8 h-8 border-2 border-black flex items-center justify-center text-black font-bold text-sm shrink-0"
                >
                  {(s.authorName ?? s.authorUsername ?? "?")[0].toUpperCase()}
                </Link>
                <div className="min-w-0">
                  <Link href={`/profile/${s.authorUsername}`} className="text-sm font-medium text-black hover:underline leading-tight block truncate">
                    {s.authorName ?? s.authorUsername}
                  </Link>
                  <span className="text-gray-400 text-xs">@{s.authorUsername}</span>
                </div>
                <span className="text-amber-400 text-sm ml-auto shrink-0">{"★".repeat(s.rating)}{"☆".repeat(5 - s.rating)}</span>
              </div>
              <h2 className="font-semibold text-gray-900">{s.speciesName}</h2>
              {s.commonName && <p className="text-sm text-gray-500">{s.commonName}</p>}
            </div>

            {sPhotos.length > 0 && !lowBandwidth && (
              <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 snap-x snap-mandatory scrollbar-none">
                {sPhotos.map((p) => (
                  <img
                    key={p.id}
                    src={p.url}
                    alt={s.speciesName}
                    className="w-36 h-36 shrink-0 object-cover snap-start"
                  />
                ))}
              </div>
            )}
            {sPhotos.length > 0 && lowBandwidth && (
              <p className="px-4 pb-2 text-xs text-gray-400">📷 {sPhotos.length} photo{sPhotos.length > 1 ? "s" : ""} hidden (low-bandwidth mode)</p>
            )}

            {s.notes && (
              <p className="px-4 pb-3 text-sm text-gray-700 leading-relaxed">{s.notes}</p>
            )}

            <div className="px-4 pb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
              {s.locationName && <span>📍 {s.locationName}</span>}
              <span>{new Date(s.sightedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <LikeButton sightingId={s.id} liked={liked} count={likeCount} />
            </div>
          </article>
        )
      })}

      {cursor && (
        <button
          onClick={loadMore}
          disabled={isPending}
          className="w-full py-3 text-[11px] uppercase tracking-widest text-black border border-black transition-colors disabled:opacity-50"
        >
          {isPending ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import { SightingActions } from "@/components/sighting-actions"
import { LikeButton } from "@/components/like-button"
import { useLowBandwidth } from "@/components/low-bandwidth-provider"
import type { SightingPhoto } from "@/lib/db/schema"

type FeedItem = {
  id: string
  speciesName: string
  commonName: string | null
  rating: number
  notes: string | null
  locationName: string | null
  visibility: string
  sightedAt: Date
}

type List = { id: string; name: string }

export function FeedLoadMore({
  initialItems,
  initialPhotosBySighting,
  initialLikesBySighting,
  initialLikedByMe,
  initialNextCursor,
  lists,
}: {
  initialItems: FeedItem[]
  initialPhotosBySighting: Record<string, SightingPhoto[]>
  initialLikesBySighting: Record<string, number>
  initialLikedByMe: string[]
  initialNextCursor: string | null
  lists: List[]
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
      const res = await fetch(`/api/feed?cursor=${encodeURIComponent(cursor)}`)
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
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-gray-900">{s.speciesName}</h2>
                  {s.commonName && <p className="text-sm text-gray-500">{s.commonName}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-amber-400 text-sm">{"★".repeat(s.rating)}{"☆".repeat(5 - s.rating)}</span>
                  <SightingActions sightingId={s.id} lists={lists} />
                </div>
              </div>
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
              <span>
                {new Date(s.sightedAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </span>
              {s.visibility !== "public" && (
                <span className="border border-black text-gray-500 px-2 py-0.5 text-[10px] uppercase tracking-widest">{s.visibility}</span>
              )}
              <LikeButton sightingId={s.id} liked={liked} count={likeCount} />
            </div>
          </article>
        )
      })}

      {cursor && (
        <button
          onClick={loadMore}
          disabled={isPending}
          className="w-full py-3 text-sm text-black hover:bg-gray-50 border border-black transition-colors disabled:opacity-50 uppercase tracking-widest text-[11px]"
        >
          {isPending ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  )
}
